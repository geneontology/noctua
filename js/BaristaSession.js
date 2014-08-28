////
//// ...
////

///
/// ...
///

var SessionInit = function(){
    
    var logger = new bbop.logger('session');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    ///
    /// Add button/events to the document.
    ///

    document.querySelector("#persona-login").addEventListener(
	"click", function(){
	    navigator.id.request();
	}, false);

    document.querySelector("#persona-logout").addEventListener(
    	"click", function(){
    	    navigator.id.logout();
    	}, false);

    ///
    /// Required callbacks.
    ///

    navigator.id.watch({

	// Code to run when the user has or is logged in (or error);
	// run after barista.js's verifyResponse().
	onlogin: function(assertion) {
	    var xhr = new XMLHttpRequest();
	    xhr.open("POST", "/persona/verify", true);
	    xhr.setRequestHeader("Content-Type", "application/json");
	    xhr.addEventListener("loadend", function(e) {

		// First thing, stop the spinner.
		jQuery('#verify-process').hide();		    

		// Default failures.
		var data = JSON.parse(this.responseText);
		if( ! data ){
		    ll('there is likely a problem with upstream');
		    alert('there is likely a problem with upstream');
		}else if( ! data.status === "okay" ){
		    ll('there is likely an auth problem: ' + data['email']);
		    alert('there is likely an auth problem: ' + data['email']);
		}else{

		    // We're in the clear and the user is in the system.
		    ll("You are logged in as: " + data.email + '/' + data.token);
			
		    // Build up interface.
		    jQuery('#logged-in-name').append(data.nickname);
		    jQuery('#logged-in-email').append(data.email);
		    jQuery('#logged-in-color').append(data.color);
		    jQuery('#logged-in-token').append(data.token);

		    // Strict toggle between the two sides.
		    jQuery('#logged-out').addClass('hidden');
		    jQuery('#logged-in').removeClass('hidden');

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
		    // Add the return button if it was rendered.
		    if( jQuery('#return-trip-login').length ){
			var rurl = global_barista_return +
			    '?barista_token=' + data.token;
			ll("bind login return event to: " + rurl);
			// jQuery('#return-trip-login').click(function(e){
			//     e.preventDefault();
			//     alert(rurl);
			// });
			jQuery('#return-trip-login').attr('href', rurl);
		    }
		}
	    }, false);
	    xhr.send(JSON.stringify({assertion: assertion}));
	},

	// Code to run when the has or is logged out (after barista.js
	// logoutResponse).
	onlogout: function() {
	    var xhr = new XMLHttpRequest();
	    xhr.open("POST", "/persona/logout", true);
	    xhr.addEventListener("loadend", function(e) {

		// First thing, stop the spinner and reveal the hidden
		// area.
		jQuery('#verify-process').hide();
		// Strict toggle between the two sides.
		jQuery('#logged-in').addClass('hidden');
		jQuery('#logged-out').removeClass('hidden');

		ll("You are logged out of Persona");
		
		// Add the return button if it was rendered.
		if( jQuery('#return-trip-logout').length ){
		    var rurl = global_barista_return;
		    ll("bind logout return event to: " + rurl);
		    // jQuery('#return-trip-logout').click(function(e){
		    // 	e.preventDefault();
		    // 	alert(rurl);
		    // });
		    jQuery('#return-trip-logout').attr('href', rurl);
		}
	    });
	    xhr.send();
	}
    });    
};

// Go.
jQuery(document).ready(function(){
    SessionInit();
});
