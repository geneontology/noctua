////
//// ...
////

// var bme_categorize = function(in_type){

//     var ret = {
// 	category: 'unknown',
// 	text: '???'
//     };

//     var t = in_type['type'];
//     if( t == 'Class' ){
// 	var i = in_type['id'];
// 	var l = in_type['label'];
// 	ret['category'] = 'instance_of';
// 	ret['text'] = l + ' (' + i + ')';
//     }else if( t == 'Restriction' ){
// 	var thing = in_type['someValuesFrom']['id'];
// 	var thing_rel = in_type['onProperty']['id'];
// 	ret['category'] = thing_rel;
// 	ret['text'] = thing_rel + ' (' + thing + ')';
//     }

//     return ret;
// };

/**
 * Return a single-line text-only one-level representation of a type.
 */
var bme_type_to_minimal = function(in_type, aid){

    var ret = '[???]';
    
    var t = in_type.type();
    var f = in_type.frame();

    if( t == 'class' ){
	ret = in_type.class_label();
    }else if( t == 'union' || t == 'intersection' ){
	ret = t + '[' + f.length + ']';
    }else{
	// SVF a little harder.
	var ctype = in_type.category();
	var ctype_r = aid.readable(ctype);

	// Probe it a bit.
	var ce = in_type.svf_class_expression();
	var cetype = ce.type();

	var inner_lbl = '???';
	if( cetype == 'class' ){
	    inner_lbl = ce.class_label();
	}else if( cetype == 'union' || cetype == 'intersection' ){
	    var cef = ce.frame();
	    inner_lbl = cetype + '[' + cef.length + ']';
	}else{
	    inner_lbl = '[SVF]';
	}

	//var cr = aid.readable(cat);
	ret = ctype_r + '(' + inner_lbl + ')';
    }

    // A little special "hi" for inferred types.
    if( in_type.inferred_p() ){
	ret = '[' + ret + ']';
    }

    return ret;
};

// /*
//  * 
//  */
// var bme_type_to_expanded = function(in_type, aid){

//     var text = '[???]';

//     var t = in_type.type();
//     //var ft = in_type.frame_type();
//     var ft = null;
//     var f = in_type.frame();
//     if( t == 'Class' && ft == null ){
// 	text = in_type.class_label() + ' (' + in_type.class_id() + ')';
//     }else if( t == 'Restriction' && ft == null ){
// 	var thing = in_type.class_label();
// 	var thing_prop = in_type.property_label();
// 	text = aid.readable(thing_prop) + '(' + thing + ')';
//     }else if( ft == 'intersectionOf' ){
// 	var thing_prop = in_type.property_label();
// 	text = aid.readable(thing_prop) + '(' + ft + '[' + f.length + '])';
//     }else if( ft == 'unionOf' ){
// 	text = ft + '[' + f.length + ']';
//     }

//     return text;
// };

/**
 * Essentially, minimal rendered as a usable span, with a color
 * option.
 */
var bme_type_to_span = function(in_type, aid, color_p){

    var min = bme_type_to_minimal(in_type, aid);
    //var exp = bme_type_to_expanded(in_type, aid);

    var text = null;
    if( color_p ){
	text = '<span ' +
	    'style="background-color: ' + aid.color(in_type.category()) + ';" ' +
	    'alt="' + min + '" ' +
	    'title="' + min +'">' +
	    min + '</span>';
    }else{
	text = '<span alt="' + min + '" title="' + min +'">' + min + '</span>';
    }

    return text;
};

/**
 * A recursive writer for when we no longer care--a table that goes on
 * and on...
 */
var bme_type_to_full = function(in_type, aid){
    var anchor = this;
    var each = bbop.core.each;

    var text = '[???]';

    var t = in_type.type();
    if( t == 'class' ){ // if simple, the easy way out
	text = bme_type_to_minimal(in_type, aid);
    }else{
	// For everything else, we're gunna hafta do a little
	// lifting...
	if( t == 'union' || t == 'intersection' ){
	    
	    // Some kind of recursion on a frame then.
	    var cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table" ' +
		    'style="background-color: ' +
	     	    aid.color(in_type.category()) + ';">',
		'<caption>' + t + '</caption>',
		//'<thead style="background-color: white;">',
		'<thead style="">',
		'</thead>',
		'<tbody>'
	    ];
	    // cache.push('<tr>'),
	    var frame = in_type.frame();
	    each(frame,
		 function(ftype){
		     cache.push('<tr style="background-color: ' +
		     		aid.color(ftype.category()) + ';">'),
		     cache.push('<td>');
		     // cache.push('<td style="background-color: ' +
	     	     // 		aid.color(ftype.category()) + ';">'),
		     cache.push(bme_type_to_full(ftype, aid));
		     cache.push('</td>');
		     cache.push('</tr>');
		 });	
	    // cache.push('</tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');	    

	}else{

	    // A little harder: need to a an SVF wrap before I recur.
	    var pid = in_type.property_id();
	    var plabel = in_type.property_label();
	    var svfce = in_type.svf_class_expression();
	    var cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table">',
		'<thead style="background-color: ' + aid.color(pid) + ';">',
		plabel,
		'</thead>',
		'<tbody>'
	    ];
	    cache.push('<tr style="background-color: ' +
		       aid.color(svfce.category()) + ';"><td>'),
	    cache.push(bme_type_to_full(svfce, aid));
	    cache.push('</td></tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');
	}
    }


    // var min = bme_type_to_minimal(in_type, aid);
    // var exp = bme_type_to_expanded(in_type, aid);
    // var text = '<span alt="' + exp + '" title="' + exp +'">' + min + '</span>';

    return text;
};

// {
//   "type": "Class",
//   "label": "phosphatase activity",
//   "id": "GO_0016791"
// }
///// 
// {
//   "someValuesFrom": {
//     "type": "Class",
//     "id": "WB_WBGene00000913"
//   },
//   "type": "Restriction",
//   "onProperty": {
//     "type": "ObjectProperty",
//     "id": "enabled_by"
//   }
/////
// {
//   "onProperty": {
//     "id": "RO:0002333",
//     "type": "ObjectProperty",
//     "label": "enabled_by"
//   },
//   "type": "Restriction",
//   "someValuesFrom": {
//     "intersectionOf": [
//       {
//         "id": "GO:0043234",
//         "type": "Class",
//         "label": "protein complex"
//       },
//       {
//         "onProperty": {
//           "id": "BFO:0000051",
//           "type": "ObjectProperty",
//           "label": "has part"
//         },
//         "type": "Restriction",
//         "someValuesFrom": {
//           "id": "UniProtKB:P0002",
//           "type": "Class"
//         }
//       },
//       {
//         "onProperty": {
//           "id": "BFO:0000051",
//           "type": "ObjectProperty",
//           "label": "has part"
//         },
//         "type": "Restriction",
//         "someValuesFrom": {
//           "id": "UniProtKB:P0003",
//           "type": "Class"
//         }
//       }
//     ]
//   }
// }

// // Support CommonJS if it looks like that's how we're rolling.
// if( typeof(exports) != 'undefined' ){
//     //exports.bbop_mme_context = bbop_mme_context;
//     //exports.bbop_type_to_tcell = bbop_type_to_tcell;
// }

