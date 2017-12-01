const tap = require('tap');
const config = require('./lib/config');

let myIp = '66.249.64.73';

let expected = {
    "ipAddress": {
        "ip": "66.249.64.73",
        "classification": "crawler",
        "lastSeen": "2016-10-02 09:16:57",
        "hostname": "crawl-66-249-64-73.googlebot.com",
        "geo": {
            "country": {
                "name": "United States",
                "code": "US"
            },
            "city": "Mountain View"
        },
        "crawler": {
            "name": "Googlebot/2.1",
            "family": "googlebot",
            "category": "search_engine_bot",
            "lastSeen": "2017-01-06 17:52:46"
        },
        "datacenter": "googgle_sites"
    }
};

tap.test(
    'IP Address: '+myIp+' google should be in datacenter ipv4 list',
    (t) => {
        config.udgerParser.set({ip:myIp});
        let ret = config.udgerParser.parse({json:true});
        t.same(ret, expected);
        t.end();
    }
);

