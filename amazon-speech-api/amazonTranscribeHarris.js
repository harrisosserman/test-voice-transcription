const request = require('request')
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
const transcribeservice = new AWS.TranscribeService();


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

function startTranscriptionJob() {
  const params = {
    LanguageCode: 'en-US',
    Media: { /* required */
      // NOTE: This is where my file is stored
      MediaFileUri: 'https://s3.amazonaws.com/talk-long-example-2/long_example.wav'
    },
    MediaFormat: 'wav',
    TranscriptionJobName: 'transcribe-anson-voice-recording-test', /* required */
    MediaSampleRateHertz: 8000,
    // NOTE: I had to create a bucket in aws s3 with this exact name before it would run
    OutputBucketName: 'transcribe-anson-voice-recording-test',
    Settings: {
      // ChannelIdentification: false,
      // MaxSpeakerLabels: 0,
      // ShowSpeakerLabels: false
    }
  };
  transcribeservice.startTranscriptionJob(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

startTranscriptionJob();



