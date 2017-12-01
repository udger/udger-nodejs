const tap = require('tap');
const config = require('./lib/config');

let myUa = 'PINGOMETER_BOT_(HTTPS://PINGOMETER.COM)';

let expected = {
    "userAgent": {
        "ua": {
            "string": "PINGOMETER_BOT_(HTTPS://PINGOMETER.COM)",
            "class": {
                "name": "Crawler",
                "code": "crawler"
            },
            "name": "PINGOMETER",
            "family": {
                "name": "PINGOMETER",
                "code": "pingometer",
                "vendor": {
                    "name": "Pingometer, LLC",
                    "code": "pingometer_llc"
                },
                "icon": "bot_pingometer.png",
                "infoUrl": "https://udger.com/resources/ua-list/bot-detail?bot=PINGOMETER#id20112"
            }
        },
        "crawler": {
            "lastSeen": "2017-01-06 18:49:59",
            "category": {
                "name": "Site monitor",
                "code": "site_monitor"
            },
            "respectRobotsTxt": "no"
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
    'User Agent: PingoMeter should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse({json:true, full:true});
        t.same(ret, expected);
        t.end();
    }
);

