const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();
const s3 = new AWS.S3();

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}
let fetchedVocabulary = false;

let transcriptionObject = {
  file: 'https://s3.amazonaws.com/talk-long-example/REC-40.-Driving.mp3',
  createBucket: generateRandomString(),
  format: 'mp3',
  jobName: generateRandomString(),
  outputBucketName: 'talk-long-example',
};

let vocabularyObject = {
  LanguageCode: 'en-US',
  Phrases: ["candidates", "talkhiring","jobseekers","resume"], // Array of Strings
  VocabularyName: generateRandomString(),
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

function getVocabulary(name, callback){
	console.log(`===Checking if vocabulary ${name} is ready...`);
	transcribeservice.getVocabulary({VocabularyName:name}, callback);
}

function deleteVocabulary(all=false, obj){
	if (all){
		deleteAll()
	} else {
		deleteFunction(obj);
	}
	function deleteFunction(obj){
		transcribeservice.deleteVocabulary({VocabularyName:obj}, (err,data)=>{
		if (err) console.log(err, err.stack); // an error occurred
		else     console.log(data);           // successful response
		});
	}
	
	function deleteAll(){
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

function listVocabularies(){
	transcribeservice.listVocabularies({},(err,data)=>{
			if (err) {console.log(err, err.stack)} // an error occurred
	  		else {
	  			console.log(data.Vocabularies)
	  		}
		})
}
// Create an request to start a transcription job to api
function createVocabulary(params={}, callback){
    transcribeservice.createVocabulary({
      LanguageCode: params.LanguageCode,
      Phrases: params.Phrases,
      VocabularyName: params.VocabularyName
      }, createVocabularyHandler);
  }
function createVocabularyHandler(err,data){
    if (err){
    	console.log(err, err.stack);
    	if (err.message ==  'You have too many vocabularies. Delete a vocabulary and try your request again.'){
    		//Auto Deleting Vocabularies
    		console.log('===Auto-deleting Vocabularies to make space');
    		deleteVocabulary(all=true)
    	} 
    } 
    else {
      console.log('===Creating Vocabulary');
      console.log(data)
      console.log("===Starting getVocabulary");
    }  
}
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
      VocabularyName: vocabularyObject.VocabularyName // To set the vocabulary
    }
  }
  transcribeservice.startTranscriptionJob(params, callback);
};

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

function transcribe(transcriptionObject, vocabularyObject, newTranscribe=true, callback) {
	function sendTranscription(){
		if (fetchedVocabulary){
			getVocabulary(vocabularyObject.VocabularyName,(err,data)=> {
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
			createBucket(transcriptionObject.createBucket, transcriptionObject.file);
		    createVocabulary(vocabularyObject);
		    fetchedVocabulary = true;
		    setTimeout(sendTranscription,10000)
		}
	}
	if (newTranscribe == true){
		sendTranscription();
		
	} else {
		callback();
	}
}
function getProgress () {
  transcribeservice.listTranscriptionJobs({Status:'COMPLETED'}, (err, results)=> {console.log(err, results)});
  transcribeservice.listTranscriptionJobs({Status:'IN_PROGRESS'}, (err, results)=> {console.log(err, results)});
  transcribeservice.listTranscriptionJobs({Status:'FAILED'}, (err, results)=> {console.log(err, results)})
}

transcribe(transcriptionObject, vocabularyObject, true, (err, response) => {
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

