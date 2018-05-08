const tap = require('tap');
const config = require('./lib/config');

let max = 20;

tap.test(
    'Random User-Agent Clients ('+max+')',
    (t) => {
        config.udgerParser.randomUAClients(max, (err, results) => {
            t.equal(err, null, "should NOT return an error");
            t.equal(results.length, max, "should return "+max+" results");
            t.end();
        });
    }
);
