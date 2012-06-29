//  Created by Ken<congbach@congbach.com> on 22/6/12.

// not optimal for loose-type javascript array
var LOG_1D_ARRAY = function(array) {
	var s = "";
	for (var i = 0; i < array.length; i++)
		s += (i ? " " : "") + array[i];
	console.log(s);
}

// not optimal for loose-type javascript array
var LOG_2D_ARRAY = function(array) {
	for (var i = 0; i < array.length; i++)
		LOG_1D_ARRAY(array[i]);
}