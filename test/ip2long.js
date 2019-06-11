const tap = require('tap');
const utils = require('../utils');

tap.test(
    'ip2long',
    (t) => {
        const iplg = utils.ip2long('213.183.51.0');
        t.equal(iplg, 3585553152, '213.183.51.0 should be equal to 3585553152');
        t.end();
    }
);
