const tap = require('tap');
const config = require('./lib/config');

let max = 3;

tap.test(
    'Random Clients Regexp ('+max+')',
    (t) => {
        config.udgerParser.randomClientsRegex(max, (err, results) => {
            t.equal(err, null, "should NOT return an error");
            t.equal(results.length, max, "should return "+max+" results");
            t.end();
        });
    }
);
