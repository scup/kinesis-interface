'use strict';

var logger = require('./logger.js');
var settings = require('../config/settings.js');
var request = require('request');
var AWS = require('aws-sdk');
var util = require('util');
var MetricBucket = require("metric-bucket/metric-bucket.js");

var s3 = new AWS.S3({
    accessKeyId: settings.aws.accessKeyId,
    secretAccessKey: settings.aws.secretAccessKey,
    awsAccountId: settings.aws.awsAccountId,
    region: settings.aws.region
});

var metricBucket = new MetricBucket(settings.metric_bucket.namespace,settings,settings.metric_bucket.flush_interval,settings.metric_bucket.flush_size);

var sender = {
    
    initializeInput: null,
    request: request,
    s3: s3,
    metricBucket: metricBucket,
    settings: settings,

    ACTION_MOVE_NEXT: 1,
    ACTION_DONT_MOVE_NEXT: 2,
    ACTION_MOVE_NEXT_AND_ALARM: 3,

    /**
     * Send the rescords to a destination
     * @param  {object} processRecordsInput The kcl processRecordsInput
     * @param  {callback} completeCallback  The kcl completeCallback
     * @return {void}                     
     */
    run: function(processRecordsInput,shardId,completeCallback) {

        logger.info("sending records to destination",{
            destination_url: settings.destination_url,
            records_count: processRecordsInput.records.length,
            shardId: shardId
        });

        var requestParams = {
            method: 'POST',
            uri: settings.destination_url,
            body: JSON.stringify(processRecordsInput.records)
        };

        //this.movePointer(processRecordsInput, completeCallback);

        var listener = this.createDestinationListener(processRecordsInput,completeCallback);

        this.request(requestParams,listener);

    },
    /**
     * Create a request listener to be used in request
     * @param  {object} processRecordsInput The kcl processRecordsInput
     * @param  {callback} completeCallback  The kcl completeCallback
     * @return {[type]}                     [description]
     */
    createDestinationListener: function(processRecordsInput, completeCallback){
        var _this = this;

        var listener = function (error, response, body) {
            
            var action = _this.getAction(error,response);

            var info = {
                "action": action,
                "error": error,
                "response": response
            };

            logger.info("destination result action",info);

            if (action === _this.ACTION_MOVE_NEXT) {

                _this.movePointer(processRecordsInput, completeCallback);

                return;
            }

            if (action === _this.ACTION_DONT_MOVE_NEXT) {

                completeCallback();

                return;

            }

            if (action === _this.ACTION_MOVE_NEXT_AND_ALARM) {

                _this.logRecords(processRecordsInput,info);

                _this.sendAlarm(processRecordsInput.records.length);

                _this.movePointer(processRecordsInput, completeCallback);

                return;

            }

            logger.error("sending records to destination not prevented response",{
                error: error,
                response: response
            });

            completeCallback();

        };

        return listener;

    },
    /**
     * getAction indentification from error and response
     * @param  {object} processRecordsInput The kcl processRecordsInput
     * @param  {callback} completeCallback  The kcl completeCallback
     * @return {void}           
     */
    getAction: function(error,response)
    {

        if (!error && response.statusCode == 200) {
            return this.ACTION_MOVE_NEXT;
        }

        if (!error && response.statusCode == 304){
            return this.ACTION_DONT_MOVE_NEXT;
        }

        if (error && error.code === "ECONNREFUSED"){
            return this.ACTION_DONT_MOVE_NEXT;
        }

        if (error || response.statusCode == 569 || response.statusCode == 500) {

            return this.ACTION_MOVE_NEXT_AND_ALARM;
        }

        if (error && error.code === "ECONNRESET") {
            return this.ACTION_MOVE_NEXT_AND_ALARM;
        }

    },
    /**
     * Move kinesis pointer
     * @param  {object} processRecordsInput The kcl processRecordsInput
     * @param  {callback} completeCallback  The kcl completeCallback
     * @return {void}                     
     */
    movePointer: function(processRecordsInput,completeCallback){

        // move kinisis pointer
        var lastSequenceNumber = processRecordsInput.records.pop().sequenceNumber;
        var listener = this.createCheckpointListener(lastSequenceNumber,completeCallback);
        processRecordsInput.checkpointer.checkpoint(lastSequenceNumber, listener);

    },
    /**
     * Create a listener to kinesis checkpoint
     * @param  {integer} lastSequenceNumber [description]
     * @param  {callback} completeCallback   [description]
     * @return
     */
    createCheckpointListener: function(lastSequenceNumber,completeCallback)
    {
        var listener = function(err, sn){
            // checkpoint success
            if(err)
            {
                logger.error('checkpoint error',{
                    lastSequenceNumber: lastSequenceNumber
                });

                completeCallback();
                return;

            }

            // checkpoint success
            logger.debug('checkpoint successful',{
                lastSequenceNumber: lastSequenceNumber
            });

            completeCallback();

        };

        return listener;
    },
    /**
     * Send alarm to cloudwatch with total of failure records
     * @param  {integer} recordsCount total of failure records
     * @return {boolean}              true always
     */
    sendAlarm: function(recordsCount)
    {
        
        logger.info('metricBucket.put',{
            metricName: this.settings.metric_bucket.errors_metric_name,
            recordsCount: recordsCount
        });

        this.metricBucket.put(this.settings.metric_bucket.errors_metric_name,recordsCount);

        return true;
    },
    /**
     * [Save all records on log]
     * @param  {array} processRecordsInput Array os records to be logged
     * @return {boolean}                   true always
     */
    logRecords: function(processRecordsInput,info)
    {
        var data = {
            records: processRecordsInput.records,
            info: info
        };

        logger.error('records not sent',data);

        this.logS3(data);
        
        return true;
    },

    /**
     * [logS3 description]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    logS3: function(data)
    {

        var _this = this;

        var now = new Date();
        var key = util.format('elastic/%s/%s/%s/%s.json',now.getFullYear(),now.getMonth()+1,now.getDate(),now.getTime());
        
        var params = {
            Bucket: 'saveLogs',
            Key: key,
            Body: JSON.stringify(data)
        };

        logger.info("uploading data to AWS S3...");

        _this.s3.upload(params, function(err, data) {

            if (err) {
                logger.error("Error uploading data to AWS S3", err);
            } else {
                logger.info("Successfully uploaded data to AWS S3",{key: key});
            }

        });

    }



};

module.exports = sender;