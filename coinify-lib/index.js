var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var baseDirectory = __dirname;   // or whatever base directory you want

var port = 9615;

console.log("server created");
http.createServer(function (request, response) {
    console.log("request... " + request.url);
    try {
        var requestUrl = url.parse(request.url);

        // need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory + "/static" + path.normalize(requestUrl.pathname);
        console.log( "fsPath ", fsPath );

        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('open', function() {
             response.writeHead(200);
        });
        fileStream.on('error',function(e) {
             response.writeHead(404);     // assume the file doesn't exist
             response.end();
        });
    } catch(e) {
        console.error( e );
        response.writeHead(500);
        response.end();     // end the response so browsers don't hang
        console.log(e.stack);
    }
}).listen(port);

console.log("listening on port "+port);

