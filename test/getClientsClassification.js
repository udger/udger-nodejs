const tap = require('tap');
const config = require('./lib/config');

let max = 3;

tap.test(
    'get clients classification',
    (t) => {
        config.udgerParser.getClientsClassification((err, results) => {
            t.equal(err, null, "should NOT return an error");
            t.equal(results.length>0, true, "should return some results");
            t.end();
        });
    }
);
