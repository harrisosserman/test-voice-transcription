const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();
const s3 = new AWS.S3();

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}
let gotVocabulary = false;

let transcriptionObject = {
  file: 'https://s3.amazonaws.com/talk-long-example/REC-40.-Driving.mp3',
  createBucket: 'newBucket',
  format: 'mp3',
  jobName: generateRandomString(),
  outputBucketName: 'talk-long-example'
};

let vocabularyObject = {
  LanguageCode: 'en-US',
  Phrases: ["candidates", "talkhiring","jobseekers","resume"], // Array of Strings
  VocabularyName: generateRandomString(),
}

// Create a bucket for the audio file
function generateBucket(bucketName, audioFile){
  s3.createBucket({Bucket: bucketName}, function(err, data) {
  if (err) {
     console.log("===We got err", err);
     } else {
       params = {Bucket: bucketName, Key: audioFile, Body: 'Hello!'};
       s3.putObject(params, function(err, data) {
           if (err) {
               console.log(err)
           } else {
               console.log("Successfully uploaded data to myBucket/myKey");
           }
        });
     }
  })
}

function getVocabulary(obj){
	if(obj){
		const name = obj
	};
	const name = vocabularyObject.VocabularyName;
	transcribeservice.listVocabularies({}, (err,data) =>{
	  if (err) {console.log(err, err.stack)} // an error occurred
	  else {
	  	console.log(`===Checking if vocabulary ${name} is ready...`);
	    data.Vocabularies.forEach((vocabulary)=>{
			if(vocabulary.VocabularyName=== name){
	          let state = vocabulary.VocabularyState;
	          const _ready = 'READY';
	          const _failed = 'FAILED';
	          if(state === _ready || state === _failed){
	            console.log(`===Finished loading vocabulary ${name}`);
	            gotVocabulary = true;
	          } 
			}
	    });
	  }
    }); 
    if (gotVocabulary !== true) {
    	setTimeout(getVocabulary,20000)
    }  else {return}
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
	  				else {console.log(data, "Successfully Deleted")}
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
function generateVocabulary(params={}, callback){
    transcribeservice.createVocabulary({
      LanguageCode: params.LanguageCode,
      Phrases: params.Phrases,
      VocabularyName: params.VocabularyName
      }, (err, data)=> {
        if (err) console.log(err, err.stack); 
        else {
          console.log('===Creating Vocabulary');
          console.log(data)
        }  
      });
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
	this.transcriptionObject = transcriptionObject;
	function getTranscription(){
		generateBucket(generateRandomString(), transcriptionObject.file);
	    generateVocabulary(vocabularyObject, (err)=>{console.error(err)});
	    getVocabulary();
	    // listVocabularies();
	    // deleteVocabulary();
	    // startTranscriptionJob(transcriptionObject, callback);
	 }
	if (newTranscribe == true){
		getTranscription()
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

