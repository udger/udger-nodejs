const udgerParser = require('../')('test/db/udgerdb_v3_test.dat');

udgerParser.set({
    ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
    ip:'2A02:598:7000:116:0:0:0:101'
});

let ret = udgerParser.parse();

// beautify json output with 4 spaces indent
console.log(JSON.stringify(ret, null, 4));