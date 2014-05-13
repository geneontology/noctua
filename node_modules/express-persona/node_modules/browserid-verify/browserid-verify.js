// ----------------------------------------------------------------------------
//
// browserid-verify.js - remote or local verification of a browserid assertion
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// ----------------------------------------------------------------------------

// core
var https = require('https');
var http  = require('http');
var querystring = require('querystring');
var url = require('url');

// npm
var tunnel = require('tunnel');

// ----------------------------------------------------------------------------

const VERIFIER_METHOD = 'POST';
const VERIFIER_URL    = 'https://verifier.login.persona.org/verify';

// ----------------------------------------------------------------------------

function browserIdVerify(opts) {
    // set some defaults
    opts      = opts      || {};
    opts.type = opts.type || 'remote';
    opts.url  = opts.url  || VERIFIER_URL;

    // return the remote verifier
    if ( opts.type === 'remote' ) {

        // firstly, parse the url
        var parsedUrl = url.parse(opts.url);

        // var httpPkg = opts.
        var protocol;
        if ( parsedUrl.protocol === 'https:' ) {
            protocol = https;
        }
        else if ( parsedUrl.protocol === 'http:' ) {
            protocol = http;
        }
        else {
            throw new Error("url protocol must be 'https:' or 'http:', not '" + parsedUrl.protocol + "'");
        }

        // create an agent if we are (1) tunneling, or (2) setting maxSockets
        var agent;
        if ( opts.proxy ) {
            var parsedProxy = url.parse(opts.proxy);
            if ( parsedProxy.protocol === 'https:' ) {
                agent = tunnel.httpsOverHttps({
                    proxy: {
                        host : parsedProxy.hostname,
                        port : parsedProxy.port,
                    }
                });
            }
            else if ( parsedProxy.protocol === 'http:' ) {
                agent = tunnel.httpsOverHttp({
                    proxy: {
                        host : parsedProxy.hostname,
                        port : parsedProxy.port,
                    }
                });
            }
            else {
                throw new Error("proxy protocol must be 'https:' or 'http:', not '" + parsedUrl.protocol + "'");
            }
        }

        return function verifyRemotely(assertion, audience, callback) {
            if (typeof callback !== 'function') throw "missing required callback argument";

            if (typeof assertion !== 'string' ) {
                process.nextTick(function() {
                    callback('assertion should be a string');
                });
                return;
            }

            if (typeof audience !== 'string' ) {
                process.nextTick(function() {
                    callback('audience should be a string');
                });
                return;
            }

            // hit the remote verifier
            var reqOpts = {
                method   : VERIFIER_METHOD,
                hostname : parsedUrl.hostname,
                path     : parsedUrl.path,
                port     : parsedUrl.port,
                rejectUnauthorized : true,
            };

            // set the agent on the request if needed
            if ( agent ) {
                reqOpts.agent = agent;
            }

            // requestHandler
            function requestHandler(resp) {
                // if the statusCode isn't what we expect, get out of here
                if ( resp.statusCode !== 200 && resp.statusCode !== 400 ) {
                    return callback(new Error("Remote verifier returned an unexpected status code : " + resp.statusCode));
                }

                // collect up the returned body
                var body = "";

                resp
                    .on('data', function(chunk) {
                        body += chunk;
                    })
                    .on('end', function() {
                        var response;

                        // catch any errors when parsing the returned JSON
                        try {
                            response = JSON.parse(body);
                        } catch(e) {
                            return callback(new Error("Remote verifier did not return JSON."));
                        }

                        if ( !response ) {
                            return callback(new Error("Remote verifier did not return any data."));
                        }

                        // Here, we're passing back the entire reponse since it should be up to
                        // if they want to do anything with any of the other fields
                        // (e.g. issuer, expires, etc).
                        return callback(null, response.email, response);
                    })
                    .on('error', function(err) {
                        return callback(err);
                    })
                ;
            }

            var req = protocol.request(reqOpts, requestHandler);
            req.on('error', function(err) {
                return callback(err);
            });

            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

            var query = querystring.stringify({
                assertion : assertion,
                audience  : audience,
            });

            req.setHeader('Content-Length', query.length);
            req.end(query, 'utf8');
        };
    }

    // return the local verifier
    if ( opts.type === 'local' ) {
        throw new Error("Program error: local verification is not yet implemented. Please use 'remote' verification.");
    }

    // don't know what this type is
    throw new Error('Unknown verifier type : ' + opts.type);
}

// ----------------------------------------------------------------------------
// export the creator function

module.exports = browserIdVerify;

// ----------------------------------------------------------------------------
