odoo.define('pos.performance.load', function (require) {
    "use strict";
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var Model = require('web.DataModel');
    var session = require('web.session');
    var PosDB = require('point_of_sale.DB');
    var Screens = require('point_of_sale.screens');

    var _t = core._t;

    var posmodel_super = models.PosModel.prototype;
    var posorder_super = models.Order;

    models.PosModel = models.PosModel.extend({
        initialize: function(){
            var self = this;

            this.offset_product = 0;
            this.loaded_product = false;

            var offset = 0
            posmodel_super.initialize.apply(this, arguments);
            this.ready.done(function (){
                self.pos_load_step = self.config.pos_load_step;
                // We continue to load product data

                // We hide loading text at the top left hand
                $('.o_loading').css('visibility', 'hidden');

                self.load_server_data_continue();
            })
        },

        load_server_data_continue: function(){
            // FIXME add domain to except product loaded from load_server_data function
            var self = this;

            var product_index = _.findIndex(posmodel_super.models, function (model) {
                return model.model === "product.product";
            });

            var product_model = posmodel_super.models[product_index];
            var context = typeof product_model.context === 'function' ? product_model.context(self,{}) : product_model.context;

            var records = new Model(product_model.model)
                .query(product_model.fields)
                .filter(product_model.domain)
                .order_by(product_model.order)
                .context(context)
                .limit(self.pos_load_step)
                .offset(self.offset_product)
                .all({shadow: true});


            records.then(function (products) {
                self.db.add_products(products);

                if (products && products.length > 0){
                    self.offset_product += products.length;
                    console.log('Loading Product, index: ', self.offset_product);
                    self.load_server_data_continue();
                }else{
                    self.loaded_product = true;
                    // do show loading again
                    $('.o_loading').css('visibility', 'visible');
                    console.log('Loaded: ', self.offset_product);
                    // click button home on product once function load is done
                    $('.breadcrumb-button.breadcrumb-home').click();
                }
            });

            return true
        },

        load_server_data: function () {
            var self = this;
            this.posorder_super = posorder_super;

            var product_index = _.findIndex(this.models, function (model) {
                return model.model === "product.product";
            });

            var product_model = this.models[product_index];
            var product_fields = product_model.fields;

            // We don't want to load product.product the normal
            // uncached way, so get rid of it.
            if (product_index !== -1) {
                this.save_product_model = this.models.splice(product_index, 1);
            }

            return posmodel_super.load_server_data.apply(this, arguments).then(function () {
                // FIXME we can do this part without call to backend, fix to use JS only
                // Put product models back
                self.models.splice(product_index, 0, self.save_product_model[0]);

                // Case existed order in cache, we also load products for these order
                var jsons = self.db.get_unpaid_orders();

                var records = new Model('pos.config').call('get_pos_config_first_load_product',
                                               [self.pos_session.config_id[0], product_fields, jsons]);

                self.chrome.loading_message(_t('Loading') + ' product.product', 1);
                return records.then(function (product) {
                    self.db.add_products(product);
                });
            });
        },

        // Case the POS is not loaded, we should scan direct from server for product that not existed in cache
        scan_product: function(parsed_code){
            var self = this;
            var done = $.Deferred();

            var res = posmodel_super.scan_product.apply(this, arguments);
            if (res){
                done.resolve(true)
            }else if (!res){
                if (!this.loaded_product){
                    var product_index = _.findIndex(posmodel_super.models, function (model) {
                        return model.model === "product.product";
                    });
                    var product_model = posmodel_super.models[product_index];
                    var product_domain = product_model.domain.concat([['barcode','=', parsed_code.code]])

                    var record = new Model(product_model.model)
                        .query(product_model.fields)
                        .filter(product_domain)
                        .order_by(product_model.order)
                        .context(product_model.context)
                        .all();
                    record.then(function(result){
                        if (result && result.length > 0){
                            self.db.add_products(result);

                            // do scan again
                            self.scan_product(parsed_code);
                            done.resolve(true)
                        }else{
                            done.resolve(false)
                        }

                    })
                }else {
                    done.resolve(false)
                }
            }
            return done
        },
    });

    Screens.ScreenWidget.include({
        barcode_product_action: function(code){

            var self = this;
            var promised_code = self.pos.scan_product(code);
            promised_code.done(function(result){
                if (result) {
                    if (self.barcode_product_screen) {
                        self.gui.show_screen(self.barcode_product_screen, null, null, true);
                    }
                } else {
                    this.barcode_error_action(result);
                }
            })
        },
    });

});