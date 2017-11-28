const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myUa = 'PINGOMETER_BOT_(HTTPS://PINGOMETER.COM)';

let expected = {
    'user_agent': {
        'ua_string': myUa,
        'ua_class': 'Crawler',
        'ua_class_code': 'crawler',
        'ua': 'PINGOMETER',
        'ua_family': 'PINGOMETER',
        'ua_family_code': 'pingometer',
        'ua_family_vendor': 'Pingometer, LLC',
        'ua_family_vendor_code': 'pingometer_llc',
        'ua_family_vendor_homepage': 'http://pingometer.com/',
        'ua_family_icon': 'bot_pingometer.png',
        'ua_family_info_url': 'https://udger.com/resources/ua-list/bot-detail?bot=PINGOMETER#id20112',
        'crawler_last_seen': '2017-01-06 18:49:59',
        'crawler_category': 'Site monitor',
        'crawler_category_code': 'site_monitor',
        'crawler_respect_robotstxt': 'no'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: PingoMeter should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

