const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

const params = {
  file: 'https://s3.amazonaws.com/phone-call-example-audio/RE912eac8d7e061d2219e0e6f06ce1e414.mp3',
  format: 'mp3',
  jobName: generateRandomString(),
  outputBucketName: 'talkhiring-long-example'
};

function startTranscriptionJob(transcriptionObject) {
  const params = {
    LanguageCode: 'en-US',
    Media: { /* required */
      // NOTE: This is where my file is stored
      MediaFileUri: transcriptionObject.file
    },
    MediaFormat: transcriptionObject.format,
    OutputBucketName: transcriptionObject.outputBucketName,
    TranscriptionJobName: transcriptionObject.jobName, /* required */
    Settings: {
      // ChannelIdentification: false,
      // MaxSpeakerLabels: 0,
      // ShowSpeakerLabels: false
    }
  }
  console.log("starting transcribe")
    transcribeservice.startTranscriptionJob(params, function(err, data) {

      console.log("startTranscriptionJob response ", err, data)

      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  };

function getTranscriptionJob(){
  // request(outputJson, { json: true }, (err, res, body) => {
  //   if (err) { return console.log(err); }
  //     console.log(body.results.transcripts);
  // });
  transcribeservice.getTranscriptionJob({
    TranscriptionJobName: '0cvm18x8bvfuwgwj0pb9'
  }, (err, response) => {
    console.log("Got response from getTranscriptionJob ", err, response)
    request(response.TranscriptionJob.Transcript.TranscriptFileUri, {json: true}, (err, res, body) => {
      console.log(err, body)
      console.log("body.results.transcripts", body.results.transcripts)
    });
  })
}

function transcribe(transcriptionObject, newTranscribe=true) {
  this.transcriptionObject = transcriptionObject;
  console.log("newTranscribe? ", newTranscribe)
  if (newTranscribe == true){
    startTranscriptionJob(transcriptionObject);
  } 
}
function  getProgress () {
  transcribeservice.listTranscriptionJobs({Status:'COMPLETED'}, (err, results)=> {console.log(err, results)});
  transcribeservice.listTranscriptionJobs({Status:'IN_PROGRESS'}, (err, results)=> {console.log(err, results)});
  transcribeservice.listTranscriptionJobs({Status:'FAILED'}, (err, results)=> {console.log(err, results)})
}
//Requires global params arg, and returns string containing transcription
function transcribeComplete (){
  return getTranscriptionJob();
}

// console.log("===creating new transcribe with params ", params)

// let transcription = new transcribe(params, true);
// // Uncomment to the list the progression of all transcription jobs
// getProgress();

// setTimeout(() => {
transcribeComplete();
// }, 5000)