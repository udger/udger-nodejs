const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let expected = {
    'ip_address': {
        'ip': '2001:41d0::',   // OVH datacenter
        'ip_ver': 6,
        'ip_classification': 'Unrecognized',
        'ip_classification_code': 'unrecognized',
        'datacenter_name': 'OVH',
        'datacenter_name_code': 'ovh',
        'datacenter_homepage': 'http://www.ovh.com/'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: 2001:41d0:: ovh should be in datacenter ipv6 list',
    (t) => {
        config.udgerParser.setIP('2001:41d0::');
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

