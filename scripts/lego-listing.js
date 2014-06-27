////
//// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjects-property
////
//// { "accessKeyId": "XXX", "secretAccessKey": "YYY", "region": "us-east-1" }

////

var AWS = require('aws-sdk');
var bbop = require('bbop').bbop;
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
