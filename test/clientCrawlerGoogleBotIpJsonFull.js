const tap = require('tap');
const config = require('./lib/config');

const myUa = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
const myIp = '66.249.64.73';

const expected = {
    'userAgent': {
        'ua': {
            'string': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
            'class': {
                'name': 'Crawler',
                'code': 'crawler'
            },
            'name': 'Googlebot/2.1',
            'version': {
                'current': '2.1',
                'major': '2'
            },
            'family': {
                'name': 'Googlebot',
                'code': 'googlebot',
                'homepage': 'http://www.google.com/bot.html',
                'vendor': {
                    'name': 'Google Inc.',
                    'code': 'google_inc',
                    'homepage': 'http://www.google.com/bot.html'
                },
                'icon': 'bot_googlebot.png',
                'infoUrl': 'https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id4966'
            }
        },
        'crawler': {
            'lastSeen': '2017-01-06 08:57:43',
            'category': {
                'name': 'Search engine bot',
                'code': 'search_engine_bot'
            },
            'respectRobotsTxt': 'yes'
        },
        'device': {
            'class': {
                'name': 'Unrecognized',
                'code': 'unrecognized',
                'icon': 'other.png',
                'iconBig': 'other_big.png',
                'infoUrl': 'https://udger.com/resources/ua-list/device-detail?device=Unrecognized'
            }
        }
    },
    'ipAddress': {
        'ip': '66.249.64.73',
        'version': 4,
        'classification': {
            'name': 'Crawler',
            'code': 'crawler'
        },
        'lastSeen': '2016-10-02 09:16:57',
        'hostname': 'crawl-66-249-64-73.googlebot.com',
        'geo': {
            'country': {
                'name': 'United States',
                'code': 'US'
            },
            'city': 'Mountain View'
        },
        'crawler': {
            'name': 'Googlebot/2.1',
            'version': {
                'current': '2.1',
                'major': '2'
            },
            'family': {
                'name': 'Googlebot',
                'code': 'googlebot',
                'homepage': 'http://www.google.com/bot.html',
                'vendor': {
                    'name': 'Google Inc.',
                    'code': 'google_inc',
                    'homepage': 'https://www.google.com/about/company/'
                },
                'icon': 'bot_googlebot.png',
                'infoUrl': 'https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id31'
            },
            'lastSeen': '2017-01-06 17:52:46',
            'category': {
                'name': 'Search engine bot',
                'code': 'search_engine_bot'
            },
            'respectRobotsTxt': 'search_engine_bot'
        },
        'datacenter': {
            'name': 'Google sites',
            'code': 'googgle_sites',
            'homepage': 'http://sites.google.com/'
        }
    },
    'fromCache': false
};

tap.test(
    'User Agent: GoogleBot should be recognized',
    (t) => {
        config.udgerParser.set({ ua:myUa, ip:myIp });
        const ret = config.udgerParser.parse({ json:true, full:true });
        t.same(ret, expected);
        t.end();
    }
);
