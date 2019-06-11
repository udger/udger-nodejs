const tap = require('tap');
const config = require('./lib/config');

const myIp = '2001:41d0:8:d54c::1';

const expected = {
    'ipAddress': {
        'ip': '2001:41d0:8:d54c::1',
        'classification': 'cgi_proxy',
        'lastSeen': '2017-01-06 03:44:15',
        'geo': {
            'country': {
                'name': 'France',
                'code': 'FR'
            },
            'city': 'Cachan'
        },
        'datacenter': 'ovh'
    }
};

tap.test(
    'IP Address: '+myIp+' ovh cgi should be in datacenter ipv6 list',
    (t) => {
        config.udgerParser.set({ ip:myIp });
        const ret = config.udgerParser.parse({ json:true });
        t.same(ret, expected);
        t.end();
    }
);
