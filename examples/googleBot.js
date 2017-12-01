const udgerParser = require('../')('test/db/udgerdb_v3_test.dat');

udgerParser.set({
    ua:'Googlebot/2.1 (+http://www.google.com/bot.html)',
    ip:'66.249.64.73'
});

let ret = udgerParser.parse({json:true});

// beautify json output with 4 spaces indent
console.log(JSON.stringify(ret, null, 4));