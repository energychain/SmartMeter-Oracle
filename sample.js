const BCMETER = require("./index.js");
const bcmeter = new BCMETER();

// User process.env or dot.env file to get container, token and deploymentid
/*
bcmeter.commit().then(function(x) {
		console.log(x);	
}).catch(function(e) {
		console.log(e);
});
*/

// Specify container, token and deployment via command line (=> will have different Address!)
bcmeter.commit("7534","3429","sample.js").then(function(x) {
		console.log(x);	
}).catch(function(e) {
		console.log(e);
});

