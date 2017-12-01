const tap = require('tap');
const config = require('./lib/config');

let myUa = 'myUnknowUA';

let expected = {
    "userAgent": {
        "ua": {
            "string": "myUnknowUA",
            "class": {
                "name": "Unrecognized",
                "code": "unrecognized"
            }
        }
    },
    "fromCache": false
};


tap.test(
    'User Agent: myUnknowUA should return unrecognized',
    (t) => {
        config.udgerParser.set({ua:myUa});
        let ret = config.udgerParser.parse({json:true, full:true});
        t.same(ret, expected);
        t.end();
    }
);
