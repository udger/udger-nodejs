const tap = require('tap');
const config = require('./lib/config');

const myIp = '66.249.64.73';

const expected = {
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
    'IP Address: '+myIp+' google should be in datacenter ipv4 list',
    (t) => {
        config.udgerParser.set({ ip:myIp });
        const ret = config.udgerParser.parse({ json:true, full:true });
        t.same(ret, expected);
        t.end();
    }
);
