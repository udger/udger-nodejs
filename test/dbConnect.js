const tap = require('tap');
const config = require('./lib/config');

tap.test(
    'Connect: disconnect() should return true',
    (t) => {
        let disconnected = config.udgerParser.disconnect();
        t.same(disconnected, true);
        t.end();
    }
);

tap.test(
    'Connect: disconnect() should return false (already disconnected)',
    (t) => {
        let disconnected = config.udgerParser.disconnect();
        t.same(disconnected, false);
        t.end();
    }
);

tap.test(
    'Connect: parse() should return {} because disconnected',
    (t) => {
        let ret = config.udgerParser.parse();
        t.same(ret, {});
        t.end();
    }
);

tap.test(
    'Connect: connect() should return true',
    (t) => {
        let reconnected = config.udgerParser.connect();
        t.same(reconnected, true);
        t.end();
    }
);

tap.test(
    'Connect: connect() should return false (already connected)',
    (t) => {
        let reconnected = config.udgerParser.connect();
        t.same(reconnected, false);
        t.end();
    }
);

tap.test(
    'Connect: parse() should return an object',
    (t) => {
        let ret = config.udgerParser.parse();
        t.same(ret, {
            from_cache:false,
            ip_address:{},
            user_agent:{}
        });
        t.end();
    }
);
