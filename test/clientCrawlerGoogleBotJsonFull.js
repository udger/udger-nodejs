const tap = require('tap');
const config = require('./lib/config');

let myUa = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

let expected = {
    "userAgent": {
        "ua": {
            "string": "Googlebot/2.1 (+http://www.google.com/bot.html)",
            "class": {
                "name": "Crawler",
                "code": "crawler"
            },
            "name": "Googlebot/2.1",
            "version": {
                "current": "2.1",
                "major": "2"
            },
            "family": {
                "name": "Googlebot",
                "code": "googlebot",
                "homepage": "http://www.google.com/bot.html",
                "vendor": {
                    "name": "Google Inc.",
                    "code": "google_inc",
                    "homepage": "http://www.google.com/bot.html"
                },
                "icon": "bot_googlebot.png",
                "infoUrl": "https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id4966"
            }
        },
        "crawler": {
            "lastSeen": "2017-01-06 08:57:43",
            "category": {
                "name": "Search engine bot",
                "code": "search_engine_bot"
            },
            "respectRobotsTxt": "yes"
        },
        "device": {
            "class": {
                "name": "Unrecognized",
                "code": "unrecognized",
                "icon": "other.png",
                "iconBig": "other_big.png",
                "infoUrl": "https://udger.com/resources/ua-list/device-detail?device=Unrecognized"
            }
        }
    },
    "fromCache": false
};

tap.test(
    'User Agent: GoogleBot should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse({json:true, full:true});
        t.same(ret, expected);
        t.end();
    }
);

