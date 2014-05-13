// ----------------------------------------------------------------------------

// npm
var test = require('tape');

// local
var verify = require('../browserid-verify.js')({
    type : 'remote',
    url  : 'http://doesnt-resolve/',
});

// ----------------------------------------------------------------------------

test('status is okay', function(t) {
    // now verify a (fake) assertion
    verify('assertion', 'https://example.com/', function(err, email, response) {
        t.ok(err, 'There is an error.');

        t.equal(err.errno, 'ENOTFOUND', 'If the host is unresolvable');

        t.equal(email, undefined, 'No email address given.');
        t.equal(response, undefined, 'No response given.');

        t.end();
    });

});

// ----------------------------------------------------------------------------
