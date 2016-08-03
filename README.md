# Kinesis Interface

This application creates a processor to wrap [Amazon KCL (Kinesis Client Library) for Node.js](https://github.com/awslabs/amazon-kinesis-client-nodejs)
code to read Kinesis stream data and forward it to a REST service, moving the stream pointer as the server responds with success or error.

## How it works?

When the application starts, a processor is registered in KCL to execute the following steps:

1. Receives data from Kinesis;
2. Send Kinesis raw record to a configured REST endpoint via HTTP Post;
3. Receives the endpoint response and apply one of the processor actions:

#### The processor receives HTTP Status Code 200 (OK)

1. Move pointer to another record (calling the KCL Checkpointer)
2. Mark record processing as complete (signalizing to KCL Callback)

#### The processor receives HTTP Status Code 304 (Not modified) or error code ECONNREFUSED (the REST endpoint is busy or offline)

1. Mark record processing as complete (signalizing to KCL Callback)

(When you don't move the pointer to another record, this record will be processed again later)

#### The processor receives HTTP Status Code 500 (Internal server error), 569 (Invalid Post Body) or error code ECONNRESET (the record is broken)

1. Log all records
2. Send an alarm to log
3. Move pointer to another record (calling the KCL Checkpointer)
4. Mark record processing as complete (signalizing to KCL Callback)

## System requirements

1. Java 8 or greater
2. Node.js 5.0 or greater

## System variables

The Kinesis Interface and KCL read some configurations through environment variables. To execute the application, check if the following environment variables exists:

Environment variable | Description
-------------------- | -----------
NODE_ENV | Description of the application environment (production, quality assurance, development)
DESTINATION_URL | Url of the REST service that will receive Kinesis data by HTTP Post
LOGGER_FILE | Location of the application log file
LOGGER_LEVEL | Defines the priority of the logs to be written. For more information see [Winston documentation](https://github.com/winstonjs/winston#logging-levels)
AWS_ACCESS_KEY_ID | Amazon Access Key used to connect in Kinesis
AWS_SECRET_ACCESS_KEY | Amazon Secret Access Key used to connect in Kinesis
AWS_REGION | Region in AWS where the Kinesis is located

## Steps to execute the application

1. Export the system variables needed to run Kinesis Interface.

2. Configure a .properties file used in KCL (see the example file in /properties directory)

3. From Kinesis Interface root directory, execute the bash command:

```bash
./node_modules/aws-kcl/bin/kcl-bootstrap --properties YOUR_PROPERTIES_FILE -e -j FULL_PATH_TO_JAVA
```

Example:
```bash
./node_modules/aws-kcl/bin/kcl-bootstrap --properties app.properties -e -j /usr/bin/java
```
