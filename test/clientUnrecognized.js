const tap = require('tap');
const config = require('./lib/config');

let defaultResult = config.defaultResult;

let myUa = 'myUnknowUA';

let expected = {
    'user_agent': {
        'ua_string': 'myUnknowUA',
        'ua_class': 'Unrecognized',
        'ua_class_code': 'unrecognized'
    }
};

expected = config.merge(defaultResult, expected);

tap.test(
    'User Agent: myUnknowUA should return unrecognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);
