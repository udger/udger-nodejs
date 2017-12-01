const tap = require('tap');
const config = require('./lib/config');

let myUa = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

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
    }
};


tap.test(
    'User Agent: GoogleBot should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse({json:true});
        t.same(ret, expected);
        t.end();
    }
);

