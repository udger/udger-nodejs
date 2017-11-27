const path = require('path');
const fs = require('fs-extra');
const db = path.resolve(__dirname,'../db/udgerdb_v3_test.dat');

let defaultResult = fs.readJsonSync(path.resolve(__dirname,'./defaultResult.json'));

let udgerParser = require('../../')(db);

module.exports = {
    defaultResult:defaultResult,
    udgerParser:udgerParser
};

