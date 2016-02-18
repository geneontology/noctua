////
//// Take a look at the used library versions versus current for
//// library packages that we maintain. Assumes that we have all of
//// out current projects checked out in a flat structure.
////

// Std utils.
var us = require('underscore');
var fs = require('fs');
var path = require('path');

///
/// Helpers and aliases.
///

var each = us.each;

function ll(arg1){
    console.log('npm-package_spy.js [' + (new Date()).toJSON() + ']: ', arg1); 
}

function _die(message){
    console.error('npm-package_spy.js ['+ (new Date()).toJSON() +']: '+ message);
    process.exit(-1);
}

///
/// CLI handling, environment setup, and initialization of clients.
///

// CLI handling.
var argv = require('minimist')(process.argv.slice(2));
//console.dir(argv);

// What directory will we monitor/operate on.
var start_dir = argv['d'] || argv['directory'];
if( ! start_dir ){
    _die('Option (d|directory) is required.');
}

///
/// Package iterator.
///

function package_iterator(dir, funct){
    
    //ll(dir);
    var ndir = path.resolve(dir);
    //ll(ndir);

    each( fs.readdirSync(ndir), function(file){
	
	//ll(file);
	var nfile = ndir + '/' + file;

	if( fs.existsSync(nfile) ){
	    var stats = fs.statSync(nfile);
	    if( stats.isDirectory() ){
		//ll('has dir: ' + nfile);
		
		var package_json_fname = nfile + '/package.json';
		if( fs.existsSync(package_json_fname) ){
		    //ll('has package.json: ' + file);
		    
		    //var obj = require(package_json_fname);
		    var obj_str = fs.readFileSync(package_json_fname);
		    var obj = JSON.parse(obj_str);
		    
		    funct(obj);
		}
	    }
	}
    });
}

///
/// Main.
///

// Scan to get current package versions.
var package_version = {};
package_iterator(start_dir, function(obj){
    if( obj['name'] &&  obj['version'] ){
	//ll(obj['name'] + ' @ ' + obj['version'] );
	package_version[obj['name']] = obj['version'];
    }
});

// Re-scan and complain about out-of-sync versions.
package_iterator(start_dir, function(obj){

    if( obj['name'] && obj['dependencies'] ){
	
	var complaints = [];
	each( obj['dependencies'], function(version, package){
	    
	    if( package_version[package] ){
		if( package_version[package] !== version ){
		    complaints.push( package + ': ' + version + ' -> ' +
				     package_version[package]);
		}
	    }
	});
	
	if( ! us.isEmpty(complaints) ){
	    console.log('In ' + obj['name'] + '...');
	    console.log('   ' + complaints.join("\n   "));
	}
    }
});
