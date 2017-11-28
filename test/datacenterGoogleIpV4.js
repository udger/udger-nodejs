const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myIp = '66.249.64.50';

let expected = {
    'ip_address': {
        'ip': myIp,   // google datacenter
        'ip_ver': 4,
        'ip_classification': 'Unrecognized',
        'ip_classification_code': 'unrecognized',
        'datacenter_name': 'Google sites',
        'datacenter_name_code': 'googgle_sites',
        'datacenter_homepage': 'http://sites.google.com/'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'IP Address: '+myIp+' google should be in datacenter ipv4 list',
    (t) => {
        config.udgerParser.set({ip:myIp});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

