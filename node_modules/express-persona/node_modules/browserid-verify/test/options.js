// ----------------------------------------------------------------------------

// npm
var test = require('tape');
var nock = require('nock');

// local
var createVerify = require('../browserid-verify.js');

// ----------------------------------------------------------------------------

test('test we accept a https: protocol for the url', function(t) {
    t.plan(1);

    try {
        createVerify({ url : 'https://example.com/' })
        t.pass('We did not throw an error on the https: protocol');
    }
    catch (e) {
        t.fail('Passing a https url to the constructor should have been okay');
    }
});

test('test we accept a http: protocol for the url', function(t) {
    t.plan(1);

    try {
        createVerify({ url : 'http://example.com/' })
        t.pass('We did not throw an error on the https: protocol');
    }
    catch (e) {
        t.fail('Passing a http url to the constructor should have been okay');
    }
});

test('we do not accept a ftp: protocol for the url', function(t) {
    t.plan(1);

    try {
        createVerify({ url : 'ftp://example.com' });
        t.fail('Passing a ftp url to the constructor should have failed');
    }
    catch (e) {
        t.pass('We obtained an exception to our url');
    }
});

test('we do not accept giberish for the url', function(t) {
    t.plan(1);

    try {
        createVerify({ url : 'localhost' });
        t.fail('Passing a url to the constructor with no protocol should have failed');
    }
    catch (e) {
        t.pass('We obtained an exception to our url since it is invalid');
    }
});

// ----------------------------------------------------------------------------
