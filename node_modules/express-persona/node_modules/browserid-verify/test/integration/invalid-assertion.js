// ----------------------------------------------------------------------------

// npm
var test = require('tape');

// local
var verify = require('../../browserid-verify.js')({
    type : 'remote'
});

// ----------------------------------------------------------------------------

test('status is failure - no certificates provided', function(t) {
    // now verify an invalid (fake) assertion
    verify('assertion', 'https://example.com/', function(err, email, response) {
        t.equal(err, null, 'There is no error.');

        t.equal(email, undefined, 'No email address is returned.');

        t.equal(response.status, 'failure', 'Assertion failed.');
        t.equal(response.reason, 'no certificates provided', 'No certificates provided.');

        t.equal(response.email, undefined, 'No email address in the response at all.');
        t.equal(response.expires, undefined, 'No expires in the response at all.');
        t.equal(response.audience, undefined, 'No audience in the response at all.');
        t.equal(response.issuer, undefined, 'No issuer in the response at all.');

        t.end();
    });

});

// ----------------------------------------------------------------------------
