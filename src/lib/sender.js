(function () {
  'use strict';

  var logger = require('./logger.js');
  var settings = require('../config/settings.js');
  var request = require('request');

  var sender = {
    initializeInput: null,
    request: request,
    settings: settings,

    UNKNOWN_ACTION: 0,
    ACTION_MOVE_NEXT: 1,
    ACTION_DONT_MOVE_NEXT: 2,
    ACTION_MOVE_NEXT_AND_ALARM: 3,

    /**
    * Send the records to a destination
    * @param  {object} processRecordsInput The KCL processRecordsInput
    * @param  {callback} completeCallback  The KCL completeCallback
    * @return {void}
    */
    run: function (processRecordsInput, shardId, completeCallback) {
      var requestParams;
      var listener;

      logger.info('sending records to destination', {
        destination_url: settings.destination_url,
        records_count: processRecordsInput.records.length,
        shardId: shardId
      });

      requestParams = {
        method: 'POST',
        uri: settings.destination_url,
        body: JSON.stringify(processRecordsInput.records)
      };

      listener = this.createDestinationListener(processRecordsInput, completeCallback);

      this.request(requestParams, listener);
    },

    /**
    * Create a request listener to be used in request
    * @param  {object} processRecordsInput The KCL processRecordsInput
    * @param  {callback} completeCallback  The KCL completeCallback
    * @return {[type]}                     [description]
    */
    createDestinationListener: function (processRecordsInput, completeCallback) {
      var self = this;

      var listener = function (error, response) {
        var action = self.getAction(error, response);

        var info = {
          action: action,
          error: error,
          response: response
        };

        logger.info('destination result action', info);

        if (action === self.ACTION_MOVE_NEXT) {
          self.movePointer(processRecordsInput, completeCallback);

          return;
        }

        if (action === self.ACTION_DONT_MOVE_NEXT) {
          completeCallback();

          return;
        }

        if (action === self.ACTION_MOVE_NEXT_AND_ALARM) {
          self.logRecords(processRecordsInput, info);

          self.sendAlarm(processRecordsInput.records.length);

          self.movePointer(processRecordsInput, completeCallback);

          return;
        }

        logger.error('sending records to destination not prevented response', {
          error: error,
          response: response
        });

        completeCallback();
      };

      return listener;
    },

    /**
    * getAction indentification from error and response
    * @param  {object} processRecordsInput The KCL processRecordsInput
    * @param  {callback} completeCallback  The KCL completeCallback
    * @return {void}
    */
    getAction: function (error, response) {
      if (!error && response.statusCode === 200) {
        return this.ACTION_MOVE_NEXT;
      }

      if (!error && response.statusCode === 304) {
        return this.ACTION_DONT_MOVE_NEXT;
      }

      if (error && error.code === 'ECONNREFUSED') {
        return this.ACTION_DONT_MOVE_NEXT;
      }

      if (error || response.statusCode === 569 || response.statusCode === 500) {
        return this.ACTION_MOVE_NEXT_AND_ALARM;
      }

      if (error && error.code === 'ECONNRESET') {
        return this.ACTION_MOVE_NEXT_AND_ALARM;
      }

      return this.UNKNOWN_ACTION;
    },

    /**
    * Move kinesis pointer
    * @param  {object} processRecordsInput The KCL processRecordsInput
    * @param  {callback} completeCallback  The KCL completeCallback
    * @return {void}
    */
    movePointer: function (processRecordsInput, completeCallback) {
      // move kinesis pointer
      var lastSequenceNumber = processRecordsInput.records.pop().sequenceNumber;
      var listener = this.createCheckpointListener(lastSequenceNumber, completeCallback);
      processRecordsInput.checkpointer.checkpoint(lastSequenceNumber, listener);
    },

    /**
    * Create a listener to kinesis checkpoint
    * @param  {integer} lastSequenceNumber [description]
    * @param  {callback} completeCallback   [description]
    * @return
    */
    createCheckpointListener: function (lastSequenceNumber, completeCallback) {
      var listener = function (err) {
        // checkpoint success
        if (err) {
          logger.error('checkpoint error', {
            lastSequenceNumber: lastSequenceNumber
          });

          completeCallback();
          return;
        }

        // checkpoint success
        logger.debug('checkpoint successful', {
          lastSequenceNumber: lastSequenceNumber
        });

        completeCallback();
      };

      return listener;
    },

    /**
    * Send alarm with total of failure records
    * @param  {integer} recordsCount total of failure records
    * @return {boolean}              true always
    */
    sendAlarm: function (recordsCount) {
      // TODO: inject alarm logic
      logger.info('sendAlarm', {
        recordsCount: recordsCount
      });

      return true;
    },

    /**
    * [Save all records on log]
    * @param  {array} processRecordsInput Array os records to be logged
    * @return {boolean}                   true always
    */
    logRecords: function (processRecordsInput, info) {
      var data = {
        records: processRecordsInput.records,
        info: info
      };

      logger.error('records not sent', data);

      return true;
    }
  };

  module.exports = sender;
}());
