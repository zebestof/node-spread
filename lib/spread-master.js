var cluster 	= require('cluster'),
	zmq 		= require('zmq'),
	Transform 	= require('stream').Transform;

if (cluster.isMaster) {

	function Master(options) {

		this.workerCount = options.workerCount > 8 ? 8 : options.workerCount;
		this.workers = [];
		this.messages = [];
		this.retries = [];
		this.currentWorker = 0;
		this.aliveWorkers = 0;
		this.subscription = 0;
		this.pendingResults = 0;
		this.socketPub = zmq.socket('pub');
		this.socketSub = zmq.socket('sub');


		this.socketSub.on('message', function (channel, message) {
			channel = channel.toString();

			if (channel == 'ping') {
				this.onForkRunning();
			} else
				this._onJobDone(channel, message);
		}.bind(this));

		this.socketSub.bindSync('ipc:///tmp/spread-1');
		this.socketPub.bindSync('ipc:///tmp/spread-2');

		this.socketSub.subscribe('');

		for (var i = 0; i < this.workerCount; i++) {
			this.workers.push(cluster.fork({script: options.script}));
		}


		Transform.call(this, {objectMode: true});
	}

	Master.prototype = {
		__proto__  : Transform.prototype,

		_transform: function (chunk, encoding, done) {
			throw new Error('Implement me');
		},

		_sendToWorkers: function (messages, callback) {
			if (!messages)
				return callback();

			if (!messages.length)
				return callback();

			this.messages = messages;
			this.done = callback;
			this.pendingResults = messages.length;

			for (var i = 0; i < this.workerCount; i++) {
				var channel = 'm-' + this._getNextWorkerPid();

				this.socketPub.send([channel, this.messages.shift()]);
			}
		},

		_pushMessage: function() {
			this.messages.push(message);
		},

		onForkRunning: function() {
			if (++this.aliveWorkers == this.workerCount) {
				this.emit('ready');
			}
		},

		_getNextWorkerPid: function() {
			var workerIndex = this.currentWorker++ % this.workers.length;

			return this.workers[workerIndex].process.pid;
		},

		_flush: function (done) {
			console.log('_flush')
			this._sendToWorkers(null, done);
		},
		i: 0,
		_onJobDone: function(channel, message) {
			this.push(message);
			this.i++;
			var newMessage = this.messages.shift();
			--this.pendingResults;

			if (newMessage) {
				var channel = 'm-' + this._getNextWorkerPid();

				this.socketPub.send([channel, newMessage]);
			} else if (!this.pendingResults) {
				console.log('spread done', this.i)
				this.done();
			}
		},
	};

	module.exports = Master;

} else {

	function Worker() {

	};

	Worker.prototype = {
		on: function(){}
	};

	module.exports = Worker;
	require(process.env.script);
}

