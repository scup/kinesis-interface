(function () {
  'use strict';

  var kcl = require('aws-kcl');
  var sender = require('./lib/sender.js');
  var logger = require('./lib/logger.js');

  var app = {

    shardId: null,

    initialize: function (initializeInput, completeCallback) {
      logger.info('app.initialize');

      this.shardId = initializeInput.shardId;
      completeCallback();
    },

    processRecords: function (processRecordsInput, completeCallback) {
      logger.info('app.processRecords');

      sender.run(processRecordsInput, this.shardId, completeCallback);
    },

    shutdown: function (shutdownInput, completeCallback) {
      // checkpoint should only be performed when shutdown reason is TERMINATE.
      if (shutdownInput.reason !== 'TERMINATE') {
        completeCallback();
        return;
      }

      // whenever checkpointing, completeCallback should only be
      // invoked once checkpoint is complete.
      shutdownInput.checkpointer.checkpoint(function () {
        completeCallback();
      });
    }
  };

  kcl(app).run();
}());
