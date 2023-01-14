const path = require('path');
const fs = require('fs-extra');
const db = path.resolve(__dirname, '../db/udgerdb_v3_test.dat');
const merge = require('merge-deep');

const defaultResult = fs.readJsonSync('./defaultResult.json');

const udgerParser = require('../../')(db);

module.exports = {
    defaultResult,
    udgerParser,
    merge
};
