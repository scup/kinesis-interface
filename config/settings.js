(function() {
	'use strict';

	require('dotenv').load({silent: true});

	var settings = {};

	settings.logger = {
		file: process.env.LOGGER_FILE || "./log/kinesis-interface.log",
		level: process.env.LOGGER_LEVEL || "info"
	};

	settings.destination_url = process.env.DESTINATION_URL;

	settings.aws = {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		awsAccountId: process.env.AWS_ACCOUNT_ID,
		region: process.env.AWS_REGION
	};

	settings.metric_bucket = {
		namespace: process.env.METRIC_BUCKET_NAMESPACE || "item-dispatcher",
		errors_metric_name: process.env.METRIC_BUCKET_ERRORS_METRIC_NAME || "kinesis-interface-errors",
		flush_interval: process.env.METRIC_BUCKET_FLUSH_INTERVAL || 60000,
		flush_size: process.env.METRIC_BUCKET_FLUSH_SIZE || 1000
	};

	module.exports = settings;

})();