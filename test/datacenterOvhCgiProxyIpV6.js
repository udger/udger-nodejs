const tap = require('tap');
const config = require('./lib/config');

const defaultResult = config.defaultResult;

const myIp = '2001:41d0:8:d54c::1';

let expected = {
    'ip_address': {
        'ip': myIp,   // OVH datacenter
        'ip_ver': 6,
        'ip_classification': 'Cgi proxy',
        'ip_classification_code': 'cgi_proxy',
        'ip_last_seen': '2017-01-06 03:44:15',
        'ip_country': 'France',
        'ip_country_code': 'FR',
        'ip_city': 'Cachan',
        'datacenter_name': 'OVH',
        'datacenter_name_code': 'ovh',
        'datacenter_homepage': 'http://www.ovh.com/'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'IP Address: '+myIp+' ovh cgi should be in datacenter ipv6 list',
    (t) => {
        config.udgerParser.set({ ip:myIp });
        const ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);
