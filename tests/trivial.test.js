////
//// This is just a test to test the testing environment.
////

// Prefer Chai assert. We're (somehow, it does not work for "assert")
// passing in "should" from the gulp-defined globals.
var assert = require('chai').assert;

describe('our testing environment is sane', function(){
    
    // State.
    var thingy = null;

    // Pre-run.    
    before(function() {
	thingy = 1;
    });
    
    // Trivially works two ways.
    it('works at all (thingy)', function(){
	thingy.should.equal(1);
        assert.equal(thingy, 1);
    });

    // Can I pull in things as expected from node_modules, etc.?
    it('I can see bbopx from my porch', function(){
	var bbopx = require('bbopx');
	assert.typeOf(bbopx, 'object');
    });
    
    // Post-run.
    after(function(){
	thingy = null;
    });
});
