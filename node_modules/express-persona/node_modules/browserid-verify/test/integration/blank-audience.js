// ----------------------------------------------------------------------------

// npm
var test = require('tape');

// local
var verify = require('../../browserid-verify.js')({
    type : 'remote'
});

// ----------------------------------------------------------------------------

test('status is failure - no audience provided', function(t) {
    // verify with an invalid (empty) audience
    verify('assertion', '', function(err, email, response) {
        t.equal(err, null, 'There is no error.');

        t.equal(email, undefined, 'No email address is returned.');

        t.equal(response.status, 'failure', 'Assertion failed.');
        t.equal(response.reason, 'need assertion and audience', 'Need assertion and audience');

        t.equal(response.email, undefined, 'No email address in the response at all.');
        t.equal(response.expires, undefined, 'No expires in the response at all.');
        t.equal(response.audience, undefined, 'No audience in the response at all.');
        t.equal(response.issuer, undefined, 'No issuer in the response at all.');

        t.end();
    });

});

// ----------------------------------------------------------------------------
