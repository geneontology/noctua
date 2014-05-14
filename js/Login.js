////
//// ...
////

///
/// ...
///

var LoginInit = function(){
    
    var logger = new bbop.logger('login');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    ///
    /// ...
    ///

    document.querySelector("#persona-login").addEventListener(
	"click",
	function() {
	    navigator.id.request();
	}, false);

    // document.querySelector("#persona-logout").addEventListener(
    // 	"click",
    // 	function() {
    // 	    navigator.id.logout();
    // 	}, false);

    navigator.id.watch(
	{
	    onlogin: function(assertion) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/persona/verify", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.addEventListener(
		    "loadend",
		    function(e) {
			var data = JSON.parse(this.responseText);
			if (data && data.status === "okay") {
			    ll("You have been logged in as: " +
			       data.email + '/' + data.token);
			    
			    jQuery('#verify-process').hide();

			    // Build up interface.
			    jQuery('#current-status').hide();
			    jQuery('#logged-in-email').append(data.email);
			    jQuery('#logged-in-color').append(data.color);
			    jQuery('#logged-in-token').append(data.token);
			    jQuery('#logged-in-well').removeClass('hidden');
			    jQuery('#logout-trip').append(
				'<strong><a href="/logout?barista_token='+
				    data.token +'">Logout</a></strong>');

			    // Only add if there was a return. Need to
			    // grab the return in
			    // global_barista_return and add the
			    // token.
			    // BUG/TODO: Obviously this is wrong and
			    // we need to 1) first properly parse the
			    // URL and then 2) reconstitute it with
			    // the new arguments. I'm just going
			    // forward for now because I don't have a
			    // client library in mind.
			    if( jQuery('#return-trip').length ){
				jQuery('#return-trip').append(
				    '<strong><a href="'+ global_barista_return+
					'?barista_token='+ data.token +
					'">Return to application</a></strong>');
			    }
			}
		    }, false);
		
		xhr.send(JSON.stringify({assertion: assertion}));
	    },
	    onlogout: function() {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/persona/logout", true);
		xhr.addEventListener(
		    "loadend",
		    function(e) {
			ll("You have been logged out of Persona");
			jQuery('#verify-process').hide();
			jQuery('#logged-out-success').removeClass('hidden');
		    });
		xhr.send();
	    }
	});    
};

// Start the day the jsPlumb way.
jQuery(document).ready(
    function(){
	LoginInit();
    });
