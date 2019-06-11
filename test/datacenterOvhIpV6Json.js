const tap = require('tap');
const config = require('./lib/config');

const myIp = '2001:41d0::';

const expected = {
    'ipAddress': {
        'ip': '2001:41d0::',
        'classification': 'unrecognized',
        'datacenter': 'ovh'
    }
};

tap.test(
    'IP Address: '+myIp+' ovh should be in datacenter ipv6 list',
    (t) => {
        config.udgerParser.set({ ip:myIp });
        const ret = config.udgerParser.parse({ json:true });
        t.same(ret, expected);
        t.end();
    }
);
