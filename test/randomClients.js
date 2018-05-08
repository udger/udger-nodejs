const tap = require('tap');
const config = require('./lib/config');

let max = 20;

tap.test(
    'Random Clients ('+max+')',
    (t) => {
        config.udgerParser.randomClients(max, (err, results) => {
            t.equal(err, null, "should NOT return an error");
            t.equal(results.length, max, "should return "+max+" results");
            t.end();
        });
    }
);
