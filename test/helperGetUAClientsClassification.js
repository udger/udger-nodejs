const tap = require('tap');
const config = require('./lib/config');

let max = 3;

tap.test(
    'get User-Agent Clients classification',
    (t) => {
        config.udgerParser.getUAClientsClassification((err, results) => {
            t.equal(err, null, "should NOT return an error");
            t.equal(results.length>0, true, "should return some results");
            t.end();
        });
    }
);
