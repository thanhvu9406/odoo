# -*- coding: utf-8 -*-
{
    'name': "pos_performance_load",

    'description': """
        Point of sale performance load product.
    """,

    'author': "Nguyễn Thành Vũ",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'point_of_sale'],

    # always loaded
    'data': [
        'views/templates.xml',
        'views/pos_config_view.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
    ],
}
