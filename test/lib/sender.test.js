(function () {
  'use strict';

  var chai = require('chai');
  var sinon = require('sinon');
  var processRecordsInput = [];
  var sandbox = null;
  var shardId = '000000000001';

  beforeEach(function () {
    var chunkSize = 10;
    var count;
    var record;

    processRecordsInput = {
      records: [],
      checkpoint: function () { }
    };

    for (count = 0; count < chunkSize; count++) {
      record = {
        data: 'eyJpZCI6MTAyMjYxMTEzNiwidGl0bGUiOiJGYWNlYm9vayBDb21tZW50IiwicGFyZW50X2lkIjoxMDIyNTk2NzQyLCJtZXNzYWdlIjoidGhlIG1lc3NhZ2UiLCJ3b3JkcyI6WyJ0aGUiLCJtZXNzYWdlIl0sInR5cGUiOiJjb21tZW50IiwicHVibGlzaGVkX2F0IjoiMjAxNi0wMS0yNVQwMTozNjo1My0wMjowMCIsImNyZWF0ZWRfYXQiOiIyMDE2LTAxLTI1VDAxOjUzOjAzLTAyOjAwIiwidXBkYXRlZF9hdCI6IjIwMTYtMDEtMjVUMDE6NTM6MDMtMDI6MDAiLCJpdGVtc19iYXRjaF9jcmVhdGVkIjoiMjAxNi0wMi0wMVQxNDo1MTozMC0wMjowMCIsImVsYXN0aWNfZGF0ZSI6bnVsbCwidGFnIjp7ImlkcyI6WyI3ODE2MDUiLCIxMDYwMTUxIl0sImNvdW50IjoyfSwic2VhcmNoIjp7ImlkIjo2Njg5MDQsInR5cGVfaWQiOiIyNSIsInR5cGUiOiJQYWdlT3JQdWJsaWNHcm91cCIsInNvY2lhbF9uZXR3b3JrIjoiRmFjZWJvb2sifSwiYW5hbHl0aWNzIjp7InR3aXR0ZXJfcmVhY2giOjAsInlvdXR1YmVfdmlld3MiOjAsIm51bWJlcl9vZl9yZXBsaWVzIjowfSwic2VudGltZW50Ijp7InZhbHVlIjoibm90X2NsYXNzaWZpZWQiLCJhdXRvbWF0aWMiOnsiYWN0aXZlIjoxLCJ2YWx1ZSI6Im5vdF9jbGFzc2lmaWVkIiwicHJlY2lzaW9uIjowfX0sImF1dGhvciI6eyJpZCI6InlhemVuNjY2IiwibmFtZSI6IllhemVuIEFiZHVsbGFoIiwicGxhdGZvcm1faWQiOjQ5MzQ3Mjg5MSwiZ2VuZGVyIjoibWFsZSIsImxvY2FsZSI6eyJhcmVhIjoiU+NvIFBhdWxvIiwiY291bnRyeSI6IkJyYXNpbCJ9fSwibW9uaXRvcmluZyI6eyJpZCI6ODg0MDksIm93bmVyIjp7ImlkIjo0ODY3NSwiZW1haWwiOiJmZWluaG9AZ21haWwuY29tIiwicGxhbiI6eyJuYW1lIjoiYmFzaWMiLCJwYWlkIjoiMCIsImFjdGl2ZSI6IjEifX19LCJtZXRhZGF0YSI6eyJldmVudCI6Im5ldyIsInRpbWVzdGFtcCI6MTQ1MzY5Mzk4M30sInJhd19jb250ZW50Ijp7ImNvbW1lbnRfaWQiOiIxMTcwMzM1ODEzMDEzMTczIiwiY29tbWVudF9yZWFsX2lkIjoiMTE3MDE2ODEwMzAyOTk0NF8xMTcwMzM1ODEzMDEzMTczIiwiY2FuX2NvbW1lbnQiOiJ0cnVlIiwidXBkYXRlX2lkIjoiMTA0MjY2NTkyOTUzNDM5XzExNzAxNjgxMDMwMjk5NDQiLCJwYXJlbnRfaWQiOiIwIiwiZnJvbV9pZCI6IjE3MjYxMDcyMjA5NDIzNzYiLCJpZGV4dGVybm8iOiIxNzI2MTA3MjIwOTQyMzc2IiwibWVzc2FnZSI6IkEgQiBDIiwiY3JlYXRlZF90aW1lIjoiMjAxNi0wMS0yNSAwMTozNjo1MyIsIm1vbml0b3JhbWVudG9faWQiOiI4ODQwOSIsImZyb21fbmFtZSI6IllhemVuIEFiZHVsbGFoIiwicGljdHVyZSI6Imh0dHA6Ly9ncmFwaC5mYWNlYm9vay5jb20vdjIuNS8xNzI2MTA3MjIwOTQyMzc2L3BpY3R1cmUiLCJ3YWxsX2lkIjoiMTA0MjY2NTkyOTUzNDM5IiwiZnJvbV91c2VyX3Byb2ZpbGVfaW1hZ2VfdXJsIjoieyJ1cmwiOiJodHRwOi8vc2l0ZS5jb20ifSJ9LCJyYXdfY29udGVudF9oYXNoIjoiMTE3MDE2ODEwMzAyOTk0NF8xMTcwMzM1ODEzMDEzMTczIn0=',
        partitionKey: '104992',
        sequenceNumber: '49554680226855507291950285542319126583233925317163745282',
        level: 'info'
      };

      processRecordsInput.records.push(record);
    }

    processRecordsInput.checkpointer = { checkpoint: function () { } };
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('sender should send records, move pointer and complete ' +
     'callback when receive status code 200', function (done) {
    // Given
    var sender = require('../../src/lib/sender.js');

    sandbox.stub(sender, 'request',
                 function (params, callback) {
                   callback(false, { statusCode: 200 });
                   return true;
                 });

    sandbox.stub(processRecordsInput.checkpointer, 'checkpoint',
                 function (lastSequenceNumber, completeCallback) {
                   completeCallback();
                 });

    // When
    sender.run(processRecordsInput, shardId, function () {
      // Then
      chai.assert(processRecordsInput.checkpointer.checkpoint.calledOnce);
      chai.assert.equal(1, 1);
      done();
    });
  });

  it('sender should send records, do not move pointer and complete ' +
     'callback when receive status code 304', function (done) {
    // Given
    var sender = require('../../src/lib/sender.js');

    sandbox.stub(sender, 'request', function (params, callback) {
      callback(false, { statusCode: 304 });
      return true;
    });

    sandbox.stub(processRecordsInput.checkpointer, 'checkpoint',
                 function (lastSequenceNumber, completeCallback) {
                   completeCallback();
                 });

    // When
    sender.run(processRecordsInput, shardId, function () {
      // Then
      chai.assert.equal(0, processRecordsInput.checkpointer.checkpoint.callCount);
      chai.assert.equal(1, 1);
      done();
    });
  });

  it('sender should send records, dont move pointer and only complete ' +
     'callback when receive http error code ECONNREFUSED', function (done) {
    // Given
    var sender = require('../../src/lib/sender.js');

    var logRecordsSpy = sandbox.spy(sender, 'logRecords');
    var metricBucketSpy = sandbox.spy(sender.metricBucket, 'put');

    sandbox.stub(sender, 'request', function (params, callback) {
      callback({ code: 'ECONNREFUSED' }, { statusCode: 666 }); // Evil lives here
    });

    sandbox.stub(processRecordsInput.checkpointer, 'checkpoint',
                 function (lastSequenceNumber, completeCallback) {
                   completeCallback();
                 });

    // When
    sender.run(processRecordsInput, shardId, function () {
      // Then
      chai.assert.equal(0, logRecordsSpy.callCount);
      chai.assert.equal(0, metricBucketSpy.callCount);
      chai.assert.equal(0, processRecordsInput.checkpointer.checkpoint.callCount);
      chai.assert.equal(1, 1);
      done();
    });
  });

  it('sender should send records, move pointer, log, send alarm and complete ' +
     'callback when receive http error code ECONNRESET', function (done) {
    // Given
    var sender = require('../../src/lib/sender.js');

    var logRecordsSpy = sandbox.spy(sender, 'logRecords');
    var metricBucketSpy = sandbox.spy(sender.metricBucket, 'put');

    sandbox.stub(sender, 'request', function (params, callback) {
      callback({ code: 'ECONNRESET' }, { statusCode: 666 }); // Evil lives here
    });

    sandbox.stub(sender, 'logS3', function () {
      return true;
    });

    sandbox.stub(processRecordsInput.checkpointer, 'checkpoint',
                 function (lastSequenceNumber, completeCallback) {
                   completeCallback();
                 });

    // When
    sender.run(processRecordsInput, shardId, function () {
      // Then
      chai.assert.equal(1, logRecordsSpy.callCount);
      chai.assert.equal(1, metricBucketSpy.callCount);
      chai.assert.equal(1, processRecordsInput.checkpointer.checkpoint.callCount);
      chai.assert.equal(1, 1);
      done();
    });
  });

  it('sender can send alarm to cloudwatch', function (done) {
    var sender = require('../../src/lib/sender.js');

    var metricBucketSpy = sandbox.spy(sender.metricBucket, 'put');

    sender.sendAlarm(100);

    chai.assert.equal(1, metricBucketSpy.callCount);

    done();
  });
}());
