// ----------------------------------------------------------------------------

// npm
var test = require('tape');
var nock = require('nock');

// local
var verify = require('../browserid-verify.js')({
    type : 'remote'
});

// ----------------------------------------------------------------------------

// create the mock server and client for the Verifier
var verifier = nock('https://verifier.login.persona.org');

test('status is okay', function(t) {
    // mock the response
    verifier
        .post('/verify')
        .replyWithFile(200, __dirname + '/status-okay.json')
    ;

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

test('status is failure - audience mismatch', function(t) {
    // mock the response
    verifier
        .post('/verify')
        .replyWithFile(200, __dirname + '/status-failure-audience-mismatch.json')
    ;

    // now verify a (fake) assertion
    verify('assertion', 'https://chilts.org/', function(err, email, response) {
        t.equal(err, null, 'There is no error.');

        t.equal(email, undefined, 'No email address returned.');

        t.equal(response.status, 'failure', 'Response status is failure, as expected.');
        t.equal(response.reason, 'audience mismatch: domain mismatch', 'Audience mismatch');
        t.equal(response.email, undefined, 'No email address in the response at all.');
        t.equal(response.expires, undefined, 'No expires in the response at all.');
        t.equal(response.audience, undefined, 'No audience in the response at all.');
        t.equal(response.issuer, undefined, 'No issuer in the response at all.');

        t.end();
    });

});

// ----------------------------------------------------------------------------
