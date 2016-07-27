(function () {
  'use strict';

  var settings = require('./../config/settings.js');
  var winston = require('winston');

  var transports = [];

  if (settings.logger.file) {
    transports.push(new winston.transports.File({
      filename: settings.logger.file,
      timestamp: true,
      json: true,
      logstash: true,
      handleExceptions: true,
      level: settings.logger.level
    }));
  }

  // Do not generate logs on console!
  module.exports = new winston.Logger({
    transports: transports
  });
}());
