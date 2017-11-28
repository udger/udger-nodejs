const udgerParser = require('../')('test/db/udgerdb_v3.dat');
const http = require('http');

var app = require('connect')();

http.createServer(app).listen(8082, '127.0.0.1');

app.use(function (req, res, next) {

    udgerParser.set({
        ua:req.headers['user-agent'],
        ip:req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    let result = udgerParser.parse();

    if (result['ip_address']['ip_classification_code'] === 'fake_crawler') {
        res.status(403);
        res.end('Sorry, you are not allowed');
        return;
    } else {
        res.end('Welcome !');
    }
});
