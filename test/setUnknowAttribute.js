const tap = require('tap');
const config = require('./lib/config');

tap.test(
    'set: should failed because unknow attribute passed',
    (t) => {
        t.throws(
            ()=> {
                config.udgerParser.set({ foo:'bar' });
            },
            {}
        );
        t.end();
    }
);
