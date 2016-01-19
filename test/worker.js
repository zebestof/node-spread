var Worker = require('../lib/spread-worker');

function AddOneToStringWorker () {
	Worker.call(this);
}

AddOneToStringWorker.prototype = {
	__proto__: Worker.prototype,

	exec: function(message, done) {

		return done(message + '1');
	}
}

var a = new AddOneToStringWorker();