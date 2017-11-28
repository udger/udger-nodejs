const tap = require('tap');
const config = require('./lib/config');

tap.test(
    'set: should failed because no data passed',
    (t) => {
        t.throw(
            ()=> {
                config.udgerParser.set();
            },
            {}
        );
        t.end();
    }
);

