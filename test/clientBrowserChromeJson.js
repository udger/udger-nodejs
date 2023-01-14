const tap = require('tap');
const config = require('./lib/config');

const myUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36';

const expected = {
    'userAgent': {
        'ua': {
            'string': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
            'class': 'browser',
            'name': 'Chrome 62.0.3202.94',
            'family': 'chrome',
            'engine': 'WebKit/Blink'
        },
        'os': {
            'code': 'windows_10',
            'family': 'windows'
        },
        'device': {
            'class': 'desktop'
        }
    }
};

tap.test(
    'User Agent: Chrome Browser should be recognized',
    (t) => {
        config.udgerParser.set({ ua:myUa });
        const ret = config.udgerParser.parse({ json:true });
        t.same(ret, expected);
        t.end();
    }
);
