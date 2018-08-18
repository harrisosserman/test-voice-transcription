const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();
const s3 = new AWS.S3();

let fetchedVocabulary = false;
const transcriptionObject = {
  file: 'https://s3.amazonaws.com/talk-long-example/REC-40.-Driving.mp3',
  createBucket: generateRandomString(),
  format: 'mp3',
  jobName: generateRandomString(),
  outputBucketName: 'talk-long-example',
};
const createVocabularyObject = {
  LanguageCode: 'en-US',
  Phrases: ["candidates", "talkhiring","jobseekers","resume"], // Array of Strings
  VocabularyName: generateRandomString(),
}

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}
// Create a bucket for the audio file
function createBucket(bucketName, audioFile){
  s3.createBucket({Bucket: bucketName}, function(err, data) {
  if (err) {
     console.log("===We got err", err);
     } else {
       params = {Bucket: bucketName, Key: audioFile, Body: 'Hello!'};
       s3.putObject(params, function(err, data) {
           if (err) {
               console.log(err)
           } else {
               console.log("Successfully uploaded bucket:", bucketName);
           }
        });
     }
  })
}
// Create an request to createVocabulary to api
function createVocabulary(params={}, callback){
    transcribeservice.createVocabulary({
      LanguageCode: params.LanguageCode,
      Phrases: params.Phrases,
      VocabularyName: params.VocabularyName
      }, createVocabularyHandler);
  }
// Handle if vocabulary list has to many vocabularies
function createVocabularyHandler(err,data){
    if (err){
      console.log(err, err.stack);
      if (err.message ==  'You have too many vocabularies. Delete a vocabulary and try your request again.'){
        //===Auto Deleting Vocabularies: development
        console.log('===Auto-deleting Vocabularies to make space');
        deleteVocabulary(true)
      } 
    } 
    else {
      console.log('===Creating Vocabulary');
      console.log(data)
      console.log("===Starting getVocabulary");
      
    }  
}

// Create an request to start a transcription job to api
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
    Settings: {
       // Setting vocabulary
      VocabularyName: createVocabularyObject.VocabularyName
    }
  }
  transcribeservice.startTranscriptionJob(params, callback);
};
// Create an request to get transcription job to api 
function getTranscriptionJob(callback) {
  transcribeservice.getTranscriptionJob({
    TranscriptionJobName: transcriptionObject.jobName
  }, callback);
}

function getFromS3Bucket(bucket, key, callback) { 
  s3.getObject({
    Bucket: bucket,
    Key: key
  }, callback);
}
// Create an request to start a transcription job to api
function getVocabulary(name, callback){
  console.log(`===Checking if vocabulary ${name} is ready...`);
  transcribeservice.getVocabulary({VocabularyName:name}, callback);
}

function deleteVocabulary(deleteFiveEntries=false, name='', namesList=[]){
  if (deleteFiveEntries){
    deleteFive()
  } else {
    deleteOne(name);
  }
  function deleteOne(name){
    transcribeservice.deleteVocabulary({VocabularyName:name}, (err,data)=>{
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    });
  }
  function deleteList(list){
    namesList.forEach((name){
      deleteOne(name)
    });
  }
  
  function deleteFive(){
    transcribeservice.listVocabularies({},(err,data)=>{
      if (err) {console.log(err, err.stack)} // an error occurred
        else {
          data.Vocabularies.forEach((vocabulary)=>{
            transcribeservice.deleteVocabulary({
              VocabularyName: vocabulary.VocabularyName
            },(err,data)=>{
            if (err) {console.log(err, err.stack)}
            else {console.log(vocabulary, "Successfully Deleted")}
            });
          });
        }
    });
  }
}
// Create an request to list Vocabularies api
function listVocabularies(){
  transcribeservice.listVocabularies({},(err,data)=>{
      if (err) {console.log(err, err.stack)} // an error occurred
        else {
          console.log(data.Vocabularies)
        }
  })
}

// Control flow of api
function transcribe(transcriptionObject, createVocabularyObject, newTranscribe=true, callback) {  
  function sendTranscription(){
    if (fetchedVocabulary){
      // Returns startTranscription, or console.log's failed response
      getVocabulary(createVocabularyObject.VocabularyName,(err,data)=> {
        if (err) {console.log(err, err.stack)} // an error occurred
        else {
            const state = data.VocabularyState;
            console.log('The current state of the vocabulary is',state);
            if (state === 'READY' || state === 'FAILED'){
              if (state === 'FAILED') {
                return console.log(data);
              }
              console.log('===Starting Transcription Job');
              return startTranscriptionJob(transcriptionObject, callback);
            } else {setTimeout(sendTranscription,10000)};
        }
      })
    } else{
      // Creating bucket and vocabulary
      createBucket(transcriptionObject.createBucket, transcriptionObject.file);
      createVocabulary(createVocabularyObject);
      // Setting fetched Vocabulary, starting getVocabulary loop
      fetchedVocabulary = true;
      setTimeout(sendTranscription,10000)
    }
  }
  if (newTranscribe === true){
    sendTranscription();
  } else {
    callback();
  }
}
// Start transcription
transcribe(transcriptionObject, createVocabularyObject, true, (err, response) => {
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
      getFromS3Bucket(transcriptionObject.outputBucketName, transcriptionObject.jobName + '.json', (err, bucketContents) => { 
          if (err) {
            console.error(err);
            return;
          }
          const stringifiedBody = bucketContents.Body.toString();
          try {
            const parsedBody = JSON.parse(stringifiedBody);
            console.log(parsedBody.results.transcripts[0].transcript);
          }catch (e) {
            console.error(e);
          }
      });
    });
  }
  tryToGetTranscriptionJob();
});
