var tunnel = require('tunnel');

// assume there is a forward proxy running locally on port 8888
var tunnelingAgent = tunnel.httpsOverHttp({
    proxy: {
        host: 'localhost',
        port: 8888
    }
});

var verify = require('../browserid-verify.js')({
    type  : 'remote',
    agent : tunnelingAgent,
});

verify('assertion', 'audience', function(err, email, response) {
    console.log('err :', err);

    // Expected: { status: 'failure', reason: 'no certificates provided' }
    console.log('email :', email);
    console.log('response :', response);
});
