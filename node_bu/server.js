// Load third party modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
const path = require('path');
const publicDir = path.posix.join(process.cwd(), '/public');
const cfg = require(publicDir + '/js/conf/conf');
const logUtil = require(publicDir + '/js/utils/log');

// to support JSON-encoded bodies
app.use(bodyParser.json());
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({extended: true}));
// log new requests
app.use(async function (req, res, next) {
    logUtil.info('New request.  Uri: ' + req.protocol + '://' + req.get('host') + req.path);
    next();
});

// Set env file
app.get('/js/pub_env.js', function (req, res) {
    let filePath;

    if (process.env.DEV_ENV) {
        filePath = path.join(publicDir, '/js/dev_env.js');
    } else {
        filePath = path.join(publicDir, '/js/pub_env.js');
    }

    res.sendFile(filePath);
});
// to get static files
app.use('/', express.static(publicDir, {index: false, extensions: ['html']}));

app.get('/', function (req, res) {
    res.sendFile(publicDir + "/login.html");
});

app.get('/keepAlive', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
    res.write('' +
        '<!DOCTYPE html>' +
        '<html lang="en" style="font-family: sans-serif; font-size: small;">' +
        '   <head>' +
        '   <title>Switchers.ai | Keep Alive</title>' +
        '   </head>' +
        '   <body>' +
        '       <h1>Switchers.ai Is ALIVE!</h1>' +
        '       <br>' +
        '       <h2>Info:</h2>' +
        '       <h4>&nbsp;&nbsp;&nbsp;&nbsp;Project: ' + cfg.project.name + '</h4>' +
        '       <h4>&nbsp;&nbsp;&nbsp;&nbsp;Description: ' + cfg.project.description + '</h4>' +
        '       <h4>&nbsp;&nbsp;&nbsp;&nbsp;Version: ' + cfg.project.version + '</h4>' +
        '       <h4>&nbsp;&nbsp;&nbsp;&nbsp;Version: ' + cfg.project.build + '</h4>' +
        '       <h4>&nbsp;&nbsp;&nbsp;&nbsp;Version: ' + cfg.project.loadedAt + '</h4>' +
        '   </body>' +
        '</html>');
    res.end();
});

http.listen(1709, function () {
    console.log('');
    console.log('Static file server running at => ' + http.address().address + http.address().port + '/');
    console.log('');
});