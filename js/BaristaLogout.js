////
//// ...
////

///
/// ...
///

var LogoutInit = function(){
    
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

    // document.querySelector("#persona-login").addEventListener(
    // 	"click",
    // 	function() {
    // 	    navigator.id.request();
    // 	}, false);

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
		    "loadend", function(e) {
			var data = JSON.parse(this.responseText);
			if (data && data.status === "okay") {
			    ll("You are logged in as: " + data.email);
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

			// 
			jQuery('#verify-process').hide();
			jQuery('#logged-out-success').removeClass('hidden');

			// Add the return button on success.
			if( jQuery('#return-trip').length ){
			    jQuery('#return-trip').append(
				'<strong><a href="'+ global_barista_return+
				    '">Return to application</a></strong>');
			}
		    });
		xhr.send();
	    }
	});    

    // Logout if we have the token and we're making the attempt.
    if( global_barista_token ){
	navigator.id.logout();	
    }
};

// Start the day the jsPlumb way.
jQuery(document).ready(
    function(){
	LogoutInit();
    });
