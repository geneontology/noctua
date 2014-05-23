// ----------------------------------------------------------------------------

// core
var http = require('http');

// npm
var test = require('tape');

// local
var verify = require('../browserid-verify.js')({
    type : 'remote',
    url  : 'http://localhost:8080/',
});

// ----------------------------------------------------------------------------

// each test will set this so that it will be served up next
var nextResponse;

// firstly, create a server and listen for it's 'request' event
var server = http.createServer();
server.on('request', function(req, res) {
    // always serve up the nextResponse
    res.setHeader('content-type', 'text/json');
    res.write(JSON.stringify(nextResponse));
    res.end();
});

// start the server
server.listen(8080, function() {

    test('status is okay', function(t) {
        // set the nextResponse for this test
        nextResponse = {
            "status" : "okay",
            "email" : "me@example.com",
            "audience" : "https://example.com",
            "expires" : 1354217396705,
            "issuer" : "example.com"
        };

        // now verify a (fake) assertion
        verify('assertion', 'https://example.com/', function(err, email, response) {
            t.equal(err, null, 'There is no error.');

            t.equal(email, 'me@example.com', 'Email address asserted correctly.');

            t.equal(response.status, 'okay', 'Response status is okay.');
            t.equal(response.email, 'me@example.com', 'Email in response is same as email passed back.');
            t.equal(response.issuer, 'example.com', 'Issuer is also example.com.');
            t.equal(response.expires, 1354217396705, 'Expires is correct.');
            t.equal(response.audience, 'https://example.com', 'Audience is correct.');

            t.equal(response.reason, undefined, 'No reason in the response at all.');

            t.end();
        });
    });

    // now perform the test
    test('status is a failure', function(t) {
        // set the nextResponse for this test
        nextResponse = {
            status : "failure",
            reason : "Content-Type expected to be one of: application/x-www-form-urlencoded, application/json"
        };

        // now verify a (fake) assertion
        verify('assertion', 'https://example.com/', function(err, email, response) {
            t.equal(err, null, 'There is no error.');

            t.equal(email, undefined, 'No email address returned.');

            t.equal(response.status, 'failure', 'Response status is failure, as expected.');
            t.equal(response.reason, 'Content-Type expected to be one of: application/x-www-form-urlencoded, application/json');
            t.equal(response.email, undefined, 'No email address in the response at all.');
            t.equal(response.expires, undefined, 'No expires in the response at all.');
            t.equal(response.audience, undefined, 'No audience in the response at all.');
            t.equal(response.issuer, undefined, 'No issuer in the response at all.');

            t.end();

            // close the server so we quit gracefully
            server.close();
        });
    });
});

// ----------------------------------------------------------------------------
