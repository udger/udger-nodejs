const tap = require('tap');
const config = require('./lib/config');

let myUa = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
let myIp = '66.249.64.73';

let expected = {
    "userAgent": {
        "ua": {
            "string": "Googlebot/2.1 (+http://www.google.com/bot.html)",
            "class": "crawler",
            "name": "Googlebot/2.1",
            "family": {
                "code": "googlebot",
                "homepage": "http://www.google.com/bot.html",
                "vendor": "google_inc"
            }
        },
        "crawler": {
            "lastSeen": "2017-01-06 08:57:43",
            "category": "search_engine_bot"
        },
        "device": {
            "class": "unrecognized"
        }
    },
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
    'User Agent: GoogleBot should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa, ip:myIp});
        let ret = config.udgerParser.parse({json:true});
        t.same(ret, expected);
        t.end();
    }
);

