const udgerParser = require('../')('./test/db/udgerdb_v3_test.dat');

//udgerParser.setUA('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.97 Safari/537.36');
//udgerParser.setUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36');
udgerParser.setUA('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko');
udgerParser.setIP("66.249.64.1");
let ret = udgerParser.parse();

console.log(ret);