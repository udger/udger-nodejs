const tap = require('tap');
const config = require('./lib/config');

tap.test(
    'set: should failed because string passed',
    (t) => {
        t.throw(
            ()=> {
                config.udgerParser.set('myString');
            },
            {}
        );
        t.end();
    }
);

