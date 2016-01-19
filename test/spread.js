var Master 		= require('../lib/spread-master'),
	fs     		= require('fs');

function TestMaster(options) {
	Master.call(this, options);
};

TestMaster.prototype = {
	__proto__: Master.prototype,

	_transform: function(chunk, encoding, done) {

		this._sendToWorkers(chunk.toString().split('\n').map(function(line) {return line +' no '}), function () {
			done();
		});
	}
};

var transform = new TestMaster({
	workerCount: 6,
	script: __dirname + '/worker.js',
});

transform.on('ready', function() {
	fs.createReadStream('./toto.txt')
	.pipe(transform)
	.pipe(fs.createWriteStream('./tata.txt'))
	.on('finish', function () {
		process.exit();
	});
})
