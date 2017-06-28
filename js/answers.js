(function( Answer, $, undefined ) {
    //Private Property
    var db = null

    //Public Property
    Answer.answer = [];

		Answer.init = function(setter) {
			db = setter
		}
}( window.Answer = window.Answer || {}, jQuery ));