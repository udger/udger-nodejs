const tap = require('tap');
const config = require('./lib/config');

let max = 2;

tap.test(
    'Random Bad IP Addresses ('+max+')',
    (t) => {
        config.udgerParser.randomIPv4(max, (err, results) => {
            t.equal(err, null, "should NOT return an error");
            t.equal(results.length, max, "should return "+max+" results");
            t.end();
        });
    }
);
