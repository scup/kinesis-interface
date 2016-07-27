(function () {
  'use strict';

  var settings = {};

  require('dotenv').load({ silent: true });

  settings.logger = {
    file: process.env.LOGGER_FILE || './log/kinesis-interface.log',
    level: process.env.LOGGER_LEVEL || 'info'
  };

  settings.destination_url = process.env.DESTINATION_URL;

  settings.aws = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsAccountId: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION
  };

  module.exports = settings;
}());
