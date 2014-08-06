////
//// List the "saved" files that GO-MME is producing. Do this by 1)
//// get a listing of the files uploaded to the S3 bucket and 2) munge
//// them into what the CDN contains.
////
//// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjects-property
////
//// A JSON file of credentials is required like:
////
//// { "accessKeyId": "XXX", "secretAccessKey": "YYY", "region": "us-east-1" }
////

var AWS = require('aws-sdk');
var bbop = require('bbop');
var opts = require('minimist');

// Aliases.
var each = bbop.core.each;

// AWS credentials from CLI.
var argv = opts(process.argv.slice(2));
var credential_file = null;
each(['f', 'file'],
     function(opt){
	 if( argv[opt] ){
	     credential_file = argv[opt];
	 }
     });
AWS.config.loadFromPath(credential_file);

// Print the files.
var s3 = new AWS.S3({params: {Bucket: 'bbop-data', Prefix: 'lego'}});
s3.listObjects(function(err, data){
  if(err){
      console.log(err, err.stack);
  }else{
      //console.log(data);
      if( data.Contents ){
	  each( data.Contents,
		function(obj){
		    var key = obj.Key;
		    // Only output .owl files.
		    if( key.substr(key.length -4 , 4) == '.owl' ){
			console.log('http://data.berkeleybop.org/' + key);
		    }
		});
	  
      }
  }
});
