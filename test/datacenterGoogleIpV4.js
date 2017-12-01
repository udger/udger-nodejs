const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myIp = '66.249.64.73';

let expected = {
    "ip_address": {
        "ip": "66.249.64.73",
        "ip_ver": 4,
        "ip_classification": "Crawler",
        "ip_classification_code": "crawler",
        "ip_hostname": "crawl-66-249-64-73.googlebot.com",
        "ip_last_seen": "2016-10-02 09:16:57",
        "ip_country": "United States",
        "ip_country_code": "US",
        "ip_city": "Mountain View",
        "crawler_name": "Googlebot/2.1",
        "crawler_ver": "2.1",
        "crawler_ver_major": "2",
        "crawler_family": "Googlebot",
        "crawler_family_code": "googlebot",
        "crawler_family_homepage": "http://www.google.com/bot.html",
        "crawler_family_vendor": "Google Inc.",
        "crawler_family_vendor_code": "google_inc",
        "crawler_family_vendor_homepage": "https://www.google.com/about/company/",
        "crawler_family_icon": "bot_googlebot.png",
        "crawler_family_info_url": "https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id31",
        "crawler_last_seen": "2017-01-06 17:52:46",
        "crawler_category": "Search engine bot",
        "crawler_category_code": "search_engine_bot",
        "crawler_respect_robotstxt": "yes",
        "datacenter_name": "Google sites",
        "datacenter_name_code": "googgle_sites",
        "datacenter_homepage": "http://sites.google.com/"
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'IP Address: '+myIp+' google should be in datacenter ipv4 list',
    (t) => {
        config.udgerParser.set({ip:myIp});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

