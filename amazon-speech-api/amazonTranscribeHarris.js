const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();

const params = {
	file: 'https://s3.amazonaws.com/talk-long-example/REC-40.-Driving.mp3',
	format: 'mp3',
	jobName: 'transcribe-anson-voice-recording-test-11',
	outputBucketName: 'talk-long-example',
	outputJson:'https://s3.amazonaws.com/talk-long-example/transcribe-anson-voice-recording-test-10.json',
};

function createVocabulary() {
  const params = {
    LanguageCode: 'en-US',
    Phrases: ['jobs','are','good'],
    VocabularyName: 'harris_test_amazon_transcribe' /* required */
  };
  // NOTE: You can only call this function once.  Afterwards, the VocabularyName is already taken
  transcribeservice.createVocabulary(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

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
    transcribeservice.startTranscriptionJob(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  		});
  	};

function getTranscriptionJob(outputJson){
	request(outputJson, { json: true }, (err, res, body) => {
	 	if (err) { return console.log(err); }
	  	console.log(body.results.transcripts);
	});
}

function transcribe(transcriptionObject, newTranscribe=true) {
	this.transcriptionObject = transcriptionObject;
	if (newTranscribe == false){
		startTranscriptionJob(transcriptionObject);
	}	
}
transcribe.prototype.getProgress = ()=>{
		transcribeservice.listTranscriptionJobs({Status:'COMPLETED'}, (err, results)=> {console.log(err, results)});
		transcribeservice.listTranscriptionJobs({Status:'IN_PROGRESS'}, (err, results)=> {console.log(err, results)});
		transcribeservice.listTranscriptionJobs({Status:'Failed'}, (err, results)=> {console.log(err, results)})
	}
//Requires global params arg, and returns string containing transcription
transcribe.prototype.transcribeComplete = (obj)=>{
		return getTranscriptionJob(obj.outputJson);
	}
let transcription = new transcribe(params);
// // Uncomment to the list the progression of all transcription jobs
// transcription.getProgress();
transcription.transcribeComplete(transcriptionOptions);