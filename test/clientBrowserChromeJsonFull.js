const tap = require('tap');
const config = require('./lib/config');

const myUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36';

const expected = {
    'userAgent': {
        'ua': {
            'string': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
            'class': {
                'name': 'Browser',
                'code': 'browser'
            },
            'name': 'Chrome 62.0.3202.94',
            'version': {
                'current': '62'
            },
            'uptodateCurrentVersion': '55',
            'family': {
                'name': 'Chrome',
                'code': 'chrome',
                'homepage': 'http://www.google.com/chrome/',
                'vendor': {
                    'name': 'Google Inc.',
                    'code': 'google_inc',
                    'homepage': 'https://www.google.com/about/company/'
                },
                'icon': 'chrome.png',
                'iconBig': 'chrome_big.png',
                'infoUrl': 'https://udger.com/resources/ua-list/browser-detail?browser=Chrome'
            },
            'engine': 'WebKit/Blink'
        },
        'os': {
            'name': 'Windows 10',
            'code': 'windows_10',
            'homepage': 'https://en.wikipedia.org/wiki/Windows_10',
            'icon': 'windows10.png',
            'iconBig': 'windows10_big.png',
            'infoUrl': 'https://udger.com/resources/ua-list/os-detail?os=Windows 10',
            'family': {
                'name': 'Windows',
                'code': 'windows',
                'vendor': {
                    'name': 'Microsoft Corporation.',
                    'code': 'microsoft_corporation',
                    'homepage': 'https://www.microsoft.com/about/'
                }
            }
        },
        'device': {
            'class': {
                'name': 'Desktop',
                'code': 'desktop',
                'icon': 'desktop.png',
                'iconBig': 'desktop_big.png',
                'infoUrl': 'https://udger.com/resources/ua-list/device-detail?device=Desktop'
            }
        }
    },
    'fromCache': false
};


tap.test(
    'User Agent: Chrome Browser should be recognized',
    (t) => {
        config.udgerParser.set({ ua:myUa });
        const ret = config.udgerParser.parse({ json:true, full:true });
        t.same(ret, expected);
        t.end();
    }
);
