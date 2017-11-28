const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let expected = {
    'user_agent': {
        'ua_string': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'ua_class': 'Crawler',
        'ua_class_code': 'crawler',
        'ua': 'Googlebot/2.1',
        'ua_version': '2.1',
        'ua_version_major': '2',
        'ua_family': 'Googlebot',
        'ua_family_code': 'googlebot',
        'ua_family_homepage': 'http://www.google.com/bot.html',
        'ua_family_vendor': 'Google Inc.',
        'ua_family_vendor_code': 'google_inc',
        'ua_family_vendor_homepage': 'https://www.google.com/about/company/',
        'ua_family_icon': 'bot_googlebot.png',
        'ua_family_info_url': 'https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id4966',
        'crawler_last_seen': '2017-01-06 08:57:43',
        'crawler_category': 'Search engine bot',
        'crawler_category_code': 'search_engine_bot',
        'crawler_respect_robotstxt': 'yes'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: Chrome Browser should be recognized',
    (t) => {

        config.udgerParser.setCacheEnable(true);
        config.udgerParser.setCacheSize(1);

        let ret;

        config.udgerParser.setUA('WeDontCare');
        config.udgerParser.parse();

        expected['from_cache'] = false;
        config.udgerParser.setUA('Googlebot/2.1 (+http://www.google.com/bot.html)');
        ret = config.udgerParser.parse();
        t.same(ret, expected, 'should not coming from cache');

        expected['from_cache'] = true;
        config.udgerParser.setUA('Googlebot/2.1 (+http://www.google.com/bot.html)');
        ret = config.udgerParser.parse();
        t.same(ret, expected, 'should coming from cache');

        config.udgerParser.setUA('NotGoogleBot/2.1 (+http://www.google.com/bot.html)');
        config.udgerParser.parse();

        expected['from_cache'] = false;
        config.udgerParser.setUA('Googlebot/2.1 (+http://www.google.com/bot.html)');
        ret = config.udgerParser.parse();
        t.same(ret, expected,' should not coming from cache');

        t.end();
    }
);
