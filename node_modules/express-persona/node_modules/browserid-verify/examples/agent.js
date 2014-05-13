var https = require('https');

var agent = new https.Agent();
agent.maxSockets = 1000000;

var verify = require('../browserid-verify.js')({
    type  : 'remote',
    agent : agent,
});

verify('assertion', 'audience', function(err, email, response) {
    console.log('err :', err);

    // Expected: { status: 'failure', reason: 'no certificates provided' }
    console.log('email :', email);
    console.log('response :', response);
});
