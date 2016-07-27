# Kinisis Interface

The Kinisis Interface process kcl processRecords method and send records to a destination(http server).

When receive a response from the destination, some actions need to be made:

#### status code 200 (everything is ok)

1. Move kinesis pointer using checkpoint method with the last.
2. execute the callback method.

#### status code 304 or error code ECONNREFUSED. (destination is busy or offline)  

1. Execute the callback method (only)

### error code ECONNRESET or status code == 569 or status code == 500 (bad record, discard all records, and go foward)

1. Log all records
2. Send a metric to cloudwatch
3. Move kinesis pointer using checkpoint method with the last.
4. execute the callback method.

## Running kcl 

1. install java

2. export variables and use (eg. macos)

```bash
export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
printenv
```

3. command line to run kcl

```bash
./node_modules/aws-kcl/bin/kcl-bootstrap --properties app.properties -e -j /usr/bin/java
```

