////
//// This is a trivial client to communicate with a Barsista server
//// that might (or might not) be listening. 
////
//// Based from:
////  https://nodejs.org/api/repl.html#repl_repl_start_options
////  https://gist.github.com/TooTallNate/2209310
////

var net = require('net');

// Try and connect using environment.
var barreport = process.env.BARISTA_REPL_PORT || 9090;
barreport = parseInt(barreport);
var sock = net.connect(barreport);

process.stdin.pipe(sock);
sock.pipe(process.stdout);

sock.on('connect', function () {
  process.stdin.resume();
  process.stdin.setRawMode(true);
});

sock.on('close', function done () {
  process.stdin.setRawMode(false);
  process.stdin.pause();
  sock.removeListener('close', done);
});

process.stdin.on('end', function () {
  sock.destroy();
  console.log();
});

process.stdin.on('data', function (b) {
  if (b.length === 1 && b[0] === 4) {
    process.stdin.emit('end');
  }
});
