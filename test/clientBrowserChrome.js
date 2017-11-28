const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36';

let expected = {
    'user_agent': {
        'ua_string': myUa,
        'ua_class': 'Browser',
        'ua_class_code': 'browser',
        'ua': 'Chrome 62.0.3202.94',
        'ua_version': '62.0.3202.94',
        'ua_version_major': '62',
        'ua_uptodate_current_version': '55',
        'ua_family': 'Chrome',
        'ua_family_code': 'chrome',
        'ua_family_homepage': 'http://www.google.com/chrome/',
        'ua_family_vendor': 'Google Inc.',
        'ua_family_vendor_code': 'google_inc',
        'ua_family_vendor_homepage': 'https://www.google.com/about/company/',
        'ua_family_icon': 'chrome.png',
        'ua_family_icon_big': 'chrome_big.png',
        'ua_family_info_url': 'https://udger.com/resources/ua-list/browser-detail?browser=Chrome',
        'ua_engine': 'WebKit/Blink',
        'os': 'Windows 10',
        'os_code': 'windows_10',
        'os_homepage': 'https://en.wikipedia.org/wiki/Windows_10',
        'os_icon': 'windows10.png',
        'os_icon_big': 'windows10_big.png',
        'os_info_url': 'https://udger.com/resources/ua-list/os-detail?os=Windows 10',
        'os_family': 'Windows',
        'os_family_code': 'windows',
        'os_family_vendor': 'Microsoft Corporation.',
        'os_family_vendor_code': 'microsoft_corporation',
        'os_family_vendor_homepage': 'https://www.microsoft.com/about/',
        'device_class': 'Desktop',
        'device_class_code': 'desktop',
        'device_class_icon': 'desktop.png',
        'device_class_icon_big': 'desktop_big.png',
        'device_class_info_url': 'https://udger.com/resources/ua-list/device-detail?device=Desktop'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: Chrome Browser should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

