const udgerParser = require('../')('./test/db/udgerdb_v3_test.dat');

udgerParser.setUA('Googlebot/2.1 (+http://www.google.com/bot.html)');
udgerParser.setIP("2403:b300:ff00::36fc:fec0");
let ret = udgerParser.parse();
console.log(ret);