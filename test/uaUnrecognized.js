const tap = require('tap');
const config = require('./lib/config');

let expected = config.defaultResult;
expected['user_agent']['ua_string'] = 'myUnknowUA';
expected['user_agent']['ua_class'] = 'Unrecognized';
expected['user_agent']['ua_class_code'] = 'unrecognized';


tap.test(
    'User Agent: myUnknowUA should return unrecognized',
    (t) => {
        config.udgerParser.setUA('myUnknowUA');
        let ret = config.udgerParser.parse();
        t.same(ret, expected);
        t.end();
    }
);
