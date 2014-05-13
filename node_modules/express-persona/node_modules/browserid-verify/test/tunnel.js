// ----------------------------------------------------------------------------

// core
var http = require('http');
var url = require('url');
var net = require('net');

// npm
var test = require('tape');
var nock = require('nock');

// ----------------------------------------------------------------------------

// local
var verify = require('../browserid-verify.js')({
    type  : 'remote',
    proxy : 'http://localhost:3333'
});

// ----------------------------------------------------------------------------
// firstly, set up a forward proxy

// Create an HTTP tunneling proxy
var proxy = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('okay');
});

proxy.on('connect', function(req, cltSocket, head) {
    // connect to an origin server
    var srvUrl = url.parse('http://' + req.url);
    var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, function() {
        var str = 'HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node-Proxy\r\n' +
            '\r\n';

        cltSocket.write(str);
        srvSocket.write(head);
        srvSocket.pipe(cltSocket);
        cltSocket.pipe(srvSocket);
    });
});

// make the proxy listen
proxy.listen(3333, '127.0.0.1', function() {
    console.log('Listening on port 3333');

    // now perform the test
    test('proxying through a local http forward proxy, at localhost:3333: status=failure (no certificates):', function(t) {

        // now verify a (fake) assertion
        verify('assertion', 'https://example.com/', function(err, email, response) {
            t.equal(err, null, 'There is no error.');

            t.equal(email, undefined, 'No email address returned.');

            t.equal(response.status, 'failure', 'Response status is failure, as expected.');
            t.equal(response.reason, 'no certificates provided');
            t.equal(response.email, undefined, 'No email address in the response at all.');
            t.equal(response.expires, undefined, 'No expires in the response at all.');
            t.equal(response.audience, undefined, 'No audience in the response at all.');
            t.equal(response.issuer, undefined, 'No issuer in the response at all.');

            t.end();

            // now close the proxy
            proxy.close();
        });
    });
});

// ----------------------------------------------------------------------------
