////
//// Merge permissions files into a single super form.
//// This is meant to merge the two files from Heiko on oven:
////  /srv/termgenie/permissions/GO.user_data.json
////  /srv/termgenie/permissions/termgenie-user-permissions.json
////
//// This will also add "minerva-go": true permissions to everybody
//// who has any kind of TermGenie perm.
////
//// Run as:
//// 
////  node ./scripts/merge-perms.js -p config/termgenie-user-permissions.json -u config/GO.user_data.json
////
//// CLI check: echo -n email@address.com | md5sum
///

var bbop = require('bbop').bbop;
var opts = require('minimist');
var crypto = require('crypto');
var fs = require("fs");

// Aliases.
var each = bbop.core.each;

///
/// Helpers.
///

// Strings to md5.
function str2md5(str){
    var shasum = crypto.createHash('md5');
    shasum.update(str);
    var ret = shasum.digest('hex');
    return ret;
}

///
/// Incoming files.
///

// AWS credentials from CLI.
var argv = opts(process.argv.slice(2));

// Authorizations.
var perm_file = null;
if( argv['p'] ){ perm_file = argv['p']; }
var perm_hash = JSON.parse(fs.readFileSync(perm_file, 'utf-8'));

// Email map list.
var user_file = null;
if( argv['u'] ){ user_file = argv['u']; }
var user_list = JSON.parse(fs.readFileSync(user_file, 'utf-8'));

///
/// Make new merged super file that hides the email address.
///

var final_super = [];
each(user_list,
     function(u){
	 
	 var email = u.email;
	 var name = u.screenname;
	 if( ! email || ! name ){
	     console.log('no name/email ?!');
	     process.exit(1);
	 }else{

	     var struct = {
		 "nickname": name,
		 //"email": email,
		 "email-md5": str2md5(email),
		 "authorizations": {},
	     };

	     var xref = u.xref || null;
	     if( xref ){ struct.xref = xref; }

	     var orid = u.orcid || null;
	     if( orid ){ struct.orcid = orid; }

	     if( perm_hash[email] ){
		 var tg = perm_hash[email]['termgenie-go'] || null;
		 if( tg ){
		     struct['authorizations']['termgenie-go'] = tg;
		     struct['authorizations']['minerva-go'] = true;
		 }
	     
		 // var mme = perm_hash[email]['minerva-go'] || null;
		 // if( mme ){ struct['authorizations']['minerva-go'] = mme; }
	     }

	     final_super.push(struct);
	 }
     });

console.log(JSON.stringify(final_super, null, 4));
