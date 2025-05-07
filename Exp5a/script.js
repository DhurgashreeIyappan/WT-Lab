var http = require('http');
var fs = require('fs');
var errorModule = require('./error'); 

http.createServer(function (req, res) {
    if (req.url === "/error") { 
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(errorModule.getErrorMessage()); 
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream('index.html').pipe(res);
    }
}).listen(8080);
