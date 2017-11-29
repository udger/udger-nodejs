const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myUa = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
let myIp = '66.249.64.73';

let expected = {
    'user_agent': {
        'ua_string': myUa,
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
        'device_class': 'Unrecognized',
        'device_class_code': 'unrecognized',
        'device_class_icon': 'other.png',
        'device_class_icon_big': 'other_big.png',
        'device_class_info_url': 'https://udger.com/resources/ua-list/device-detail?device=Unrecognized',
        'crawler_last_seen': '2017-01-06 08:57:43',
        'crawler_category': 'Search engine bot',
        'crawler_category_code': 'search_engine_bot',
        'crawler_respect_robotstxt': 'yes'
    },
    'ip_address': {
        'ip': myIp,
        'ip_ver': 4,
        'ip_classification': 'Crawler',
        'ip_classification_code': 'crawler',
        'ip_hostname': 'crawl-66-249-64-73.googlebot.com',
        'ip_last_seen': '2016-10-02 09:16:57',
        'ip_country': 'United States',
        'ip_country_code': 'US',
        'ip_city': 'Mountain View',
        'crawler_name': 'Googlebot/2.1',
        'crawler_ver': '2.1',
        'crawler_ver_major': '2',
        'crawler_family': 'Googlebot',
        'crawler_family_code': 'googlebot',
        'crawler_family_homepage': 'http://www.google.com/bot.html',
        'crawler_family_vendor': 'Google Inc.',
        'crawler_family_vendor_code': 'google_inc',
        'crawler_family_vendor_homepage': 'https://www.google.com/about/company/',
        'crawler_family_icon': 'bot_googlebot.png',
        'crawler_family_info_url': 'https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id31',
        'crawler_last_seen': '2017-01-06 17:52:46',
        'crawler_category': 'Search engine bot',
        'crawler_category_code': 'search_engine_bot',
        'crawler_respect_robotstxt': 'yes',
        'datacenter_name': 'Google sites',
        'datacenter_name_code': 'googgle_sites',
        'datacenter_homepage': 'http://sites.google.com/'
    },

};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: GoogleBot should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa, ip:myIp});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

