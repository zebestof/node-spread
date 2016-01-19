var cluster 	= require('cluster'),
	redis 		= require('redis'),
	redisSub 	= redis.createClient(),
	redisPub 	= redis.createClient();

function Worker() {
	this.pid = process.pid;
	console.log('Worker alive ' + this.pid);

	redisSub.subscribe('m-'+this.pid);
	redisSub.on('message', this._onReceiveJob.bind(this));
	redisPub.publish('ping', this.pid);
}

Worker.prototype = {

	exec: function(data) {
		throw new Error('Implement me');
	},

	_onFinishedJob: function(message) {
		redisPub.publish('w-' + this.pid, message);
	},

	_onReceiveJob: function(channel, message) {
		this.exec(message, function(message) {
			this._onFinishedJob(message||'');
		})
	},
};

module.exports = Worker;
