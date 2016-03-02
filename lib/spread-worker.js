var cluster 	= require('cluster'),
	zmq 		= require('zmq');

function Worker() {
	this.pid = process.pid;
	this.socketPub = zmq.socket('pub');
	this.socketSub = zmq.socket('sub');


	this.socketSub.subscribe('m-'+this.pid);
	this.socketSub.on('message', this._onReceiveJob.bind(this));

	this.socketPub.connect('ipc:///tmp/spread-1');
	this.socketSub.connect('ipc:///tmp/spread-2');


	setTimeout(function () {
		this.socketPub.send(['ping', this.pid]);
	}.bind(this),Math.random()*10)
}

Worker.prototype = {

	exec: function(data) {
		throw new Error('Implement me');
	},

	_onFinishedJob: function(message) {
		this.socketPub.send(['w-' + this.pid, message]);
	},

	_onReceiveJob: function(channel, message) {
		this.exec(message.toString(), function(message) {
			this._onFinishedJob(message||'');
		}.bind(this))
	},
};

module.exports = Worker;
