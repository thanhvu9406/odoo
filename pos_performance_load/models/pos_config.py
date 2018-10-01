# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright 2018 - Nguyen Thanh Vu
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not see <http://www.gnu.org/licenses/>.
#
##############################################################################
from odoo import models, fields, api
import json


class PosConfig(models.Model):
    _inherit = 'pos.config'

    # firstload_partner_ids = fields.Many2many('res.partner', 'pos_config_res_partner_fist_load_rel', 'config_id', 'partner_id',
    #                                          'First load Customer', domain=[('customer', '=', True)])

    firstload_product_ids = fields.Many2many('product.product', 'pos_config_product_product_fist_load_rel', 'config_id',
                                             'product_id', 'First load Product',
                                             domain=[('sale_ok', '=', True), ('available_in_pos', '=', True)])

    firstload_ctg_ids = fields.Many2many('pos.category', 'pos_config_pos_category_fist_load_rel', 'config_id', 'ctg_id',
                                         'First load Product Category')
    pos_load_step = fields.Integer('POS load step', default=1000, required=1)


    @api.model
    def get_pos_config_first_load_domain(self, config):
        # FIXME we dont use first load Partner, so upgrade it at the next time
        res = {
            # 'partner': [['customer', '=', True]],
            'product': [['sale_ok', '=', True], ['available_in_pos', '=', True]],
        }

        # res['partner'] += [['id', 'in', config.firstload_partner_ids.ids or []]]
        res['product'] += ['|',
                           ['id', 'in', config.firstload_product_ids.ids or []],
                           ['pos_categ_id', 'in', config.firstload_ctg_ids.ids or []]]
        return res

    @api.model
    def get_product_order_cache(self, order_jsons):
        res_ids = []
        Product = self.env['product.product'].sudo(self._uid)

        if not order_jsons or len(order_jsons) < 1:
            return Product

        for order in order_jsons:
            for line in order['lines']:
                res_ids.append(line[2]['product_id'])
        return Product.search([('id', 'in', list(set(res_ids)))])

    @api.model
    def get_pos_config_first_load_product(self, config_id, p_fields, order_jsons):
        Config = self.env['pos.config'].sudo().browse(config_id)
        Product = self.env['product.product'].sudo(self._uid)
        products = Product.search(self.get_pos_config_first_load_domain(Config)['product'])
        # also get product from cache order
        products |= self.get_product_order_cache(order_jsons)
        prod_ctx = products.with_context(pricelist=Config.pricelist_id.id, display_default_code=False,
                                         lang=self.env.user.lang)
        return prod_ctx.read(p_fields)

