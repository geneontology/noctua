////
//// Experimental web REPL for noodling with JSON services.
////
//// You need to have bbop.js in your node path, either by using npm
//// or node usage like below.
////
//// Usage:
////   NODE_PATH='./npm/' node bin/web-repl.js
////
//// Example session:
////   var t = 'http://amigo2.berkeleybop.org/cgi-bin/amigo2/amigo/term/GO:0022008/json';
////   get(t, {'foo':[1, 2]})
////   [wait until response]
////   res
////   dat
////

var bbop = require('bbop').bbop;
var repl = require('repl');

var res = new bbop.rest.response.json(null);
var jr = new bbop.rest.manager.node(bbop.rest.response.json);

global.bbop = bbop;
global.jr = jr;
global.res = res;
global.dat = {};
global.get = function(url, data){
    return jr.action(url, data);
};
global.post = function(url, data){
    return jr.action(url, data, 'post');
};

function on_success(resp, man){
    console.log("\nRequest complete.");
    global.res = resp;
    global.dat = resp.raw();
}
function on_error(resp, man){
    console.log("\nRequest failed.");
    global.res = resp;
    global.dat = resp.raw();
}

jr.register('success', 'foo', on_success);
jr.register('error', 'bar', on_error);

var wepl_args = {
    'useGlobal': true,
    'terminal': true,
    'prompt': "wepl> "
};
var wepl = repl.start(wepl_args);
