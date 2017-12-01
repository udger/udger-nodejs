const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myUa = 'IEMobile 1.1';

let expected = {
    'user_agent': {
        'ua_string': myUa,
        'ua_class': 'Mobile browser',
        'ua_class_code': 'mobile_browser',
        'ua': 'IE Mobile 1.1',
        'ua_version': '1.1',
        'ua_version_major': '1',
        'ua_family': 'IE Mobile',
        'ua_family_code': 'ie_mobile',
        'ua_family_homepage': 'https://en.wikipedia.org/wiki/Internet_Explorer_Mobile',
        'ua_family_vendor': 'Microsoft Corporation.',
        'ua_family_vendor_code': 'microsoft_corporation',
        'ua_family_vendor_homepage': 'https://www.microsoft.com/about/',
        'ua_family_icon': 'iemobile.png',
        'ua_family_info_url': 'https://udger.com/resources/ua-list/browser-detail?browser=IE Mobile',
        'ua_engine': 'Trident',
        'device_class': 'Smartphone',
        'device_class_code': 'smartphone',
        'device_class_icon': 'phone.png',
        'device_class_icon_big': 'phone_big.png',
        'device_class_info_url': 'https://udger.com/resources/ua-list/device-detail?device=Smartphone'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: IEMobile 1.1 should be recognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);

