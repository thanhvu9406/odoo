# -*- coding: utf-8 -*-
{
    'name': "x2many_next_button",

    'summary': """
        add next - previous button to popup x2many lines
        """,

    'author': "Nguyễn Thành Vũ",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '1.0',

    # any module necessary for this one to work correctly
    'depends': ['base', 'web'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
    ],
    # 'qweb': ['static/src/xml/*']
}