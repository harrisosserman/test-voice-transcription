const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();
const s3 = new AWS.S3();

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

const params = {
  file: 'https://s3.amazonaws.com/phone-call-example-audio/RE912eac8d7e061d2219e0e6f06ce1e414.mp3',
  format: 'mp3',
  jobName: generateRandomString(),
  outputBucketName: 'talkhiring-long-example'
};

function startTranscriptionJob(transcriptionObject, callback) {
  const params = {
    LanguageCode: 'en-US',
    Media: { /* required */
      // NOTE: This is where my file is stored
      MediaFileUri: transcriptionObject.file
    },
    MediaFormat: transcriptionObject.format,
    OutputBucketName: transcriptionObject.outputBucketName,
    TranscriptionJobName: transcriptionObject.jobName, /* required */
    Settings: {}
  }
  transcribeservice.startTranscriptionJob(params, callback);
};

function getTranscriptionJob(callback) {
  transcribeservice.getTranscriptionJob({
    TranscriptionJobName: params.jobName
  }, callback);
}

function getFromS3Bucket(bucket, key, callback) { 
  s3.getObject({
    Bucket: bucket,
    Key: key
  }, callback);
}

function transcribe(transcriptionObject, newTranscribe=true, callback) {
  this.transcriptionObject = transcriptionObject;
  if (newTranscribe == true){
    startTranscriptionJob(transcriptionObject, callback);
  } else {
    callback();
  }
}
function  getProgress () {
  transcribeservice.listTranscriptionJobs({Status:'COMPLETED'}, (err, results)=> {console.log(err, results)});
  transcribeservice.listTranscriptionJobs({Status:'IN_PROGRESS'}, (err, results)=> {console.log(err, results)});
  transcribeservice.listTranscriptionJobs({Status:'FAILED'}, (err, results)=> {console.log(err, results)})
}

transcribe(params, true, (err, response) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("===transcribe response", response)

  function tryToGetTranscriptionJob() {
    getTranscriptionJob((err, body) => {
      if (err) {
        console.error(err);
        return;
      }
      if (body.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
        console.error(body);
        return;
      }
      if (body.TranscriptionJob.TranscriptionJobStatus === 'IN_PROGRESS') {
        console.log("IN IN_PROGRESS", body)
        setTimeout(tryToGetTranscriptionJob, 5000);
        return;
      }
      console.log("body", body)
      getFromS3Bucket(params.outputBucketName, params.jobName + '.json', (err, bucketContents) => { 
        if (err) {
          console.error(err);
          return;
        }
        console.log("bucketContents", bucketContents)
      });
    });
  }
  tryToGetTranscriptionJob();
});