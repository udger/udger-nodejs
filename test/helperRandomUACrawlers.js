const tap = require('tap');
const config = require('./lib/config');

const max = 3;

tap.test(
    'Random User-Agent Crawlers ('+max+')',
    (t) => {
        config.udgerParser.randomUACrawlers(max, (err, results) => {
            t.equal(err, null, 'should NOT return an error');
            t.equal(results.length, max, 'should return '+max+' results');
            t.end();
        });
    }
);
