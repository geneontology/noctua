////
//// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjects-property
////

var AWS = require('aws-sdk');
var bbop = require('bbop').bbop;

var each = bbop.core.each;

AWS.config.loadFromPath('./aws-go-mme.json');
var s3 = new AWS.S3({params: {Bucket: 'bbop-data', Prefix: 'lego'}});
s3.listObjects(function(err, data){
  if(err){
      console.log(err, err.stack);
  }else{
      console.log(data);
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

  // for (var index in data.Buckets) {
  //   var bucket = data.Buckets[index];
  //   console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
  // }
