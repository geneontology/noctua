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
        .reply(503, 'Server is busy, try again later.')
    ;

    // now verify a (fake) assertion
    verify('assertion', 'https://example.com/', function(err, email, response) {
        t.ok(err, 'There is an error.');

        t.equal(email, undefined, 'No email address provided.');
        t.equal(response, undefined, 'No response at all.');

        t.end();
    });

});

// ----------------------------------------------------------------------------
