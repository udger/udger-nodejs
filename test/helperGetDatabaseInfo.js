const tap = require('tap');
const config = require('./lib/config');

tap.test(
    'Get database info',
    (t) => {
        config.udgerParser.getDatabaseInfo((err, result) => {

            t.equal(
                result.version,
                '20170106-01',
                'version attribute should be 20170106-01'
            );

            t.equal(
                result.information,
                'Data v3 for Local parser - test data, no full database',
                'information attribute should be "Data v3 for Local parser - test data, no full database"'
            );

            t.equal(
                result.lastupdate,
                1483690193,
                'lastupdate attribute should be 1483690193'
            );

            t.end();
        });
    }
);
