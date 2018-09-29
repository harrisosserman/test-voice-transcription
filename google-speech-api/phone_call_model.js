// Imports the Google Cloud client library for Beta API
/**
 * TODO(developer): Update client library import to use new
 * version of API when desired features become available
 */
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'credentials.json';

const speech = require('@google-cloud/speech').v1p1beta1;
const fs = require('fs');

// Creates a client
const client = new speech.SpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
// const filename = 'Local path to audio file, e.g. /path/to/audio.raw';
  const config = {
    encoding: `LINEAR16`,
    sampleRateHertz: 8000,
    languageCode: `en-US`,
    enableSpeakerDiarization: true,
    diarizationSpeakerCount: 2,
    model: `phone_call`,
  };

  const audio = {
   // content: fs.readFileSync('/Users/harrisosserman/talkhiring/test-voice-transcription/google-speech-api/RE6643993f74cf4358032483ecf279c967.wav').toString('base64'),
    uri: 'gs://example-recordings/teamwork.wav'
  };

// const audio = {
//   uri: 'https://api.twilio.com/2010-04-01/Accounts/ACc843a910f684a2588e604e81a4f73430/Recordings/RE000e359e88051ee269094523159ee0d4'
// };

const request = {
  config: config,
  audio: audio,
};

// Detects speech in the audio file
client
  // .recognize(request)
  .longRunningRecognize(request)
  .then(data => {
    console.log("got response", data)
    const response = data[0];
    return response.promise()
    // response.results.forEach(result => {
    //   const alternative = result.alternatives[0];
    //   console.log(alternative.transcript);
    // });
  })
  .then(data => {
    const response = data[0];
    console.log("Transcription response: ", JSON.stringify(response, null, 3))    
    const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
    console.log(`Transcription: ${transcription}`);
  })  
  .catch(err => {
    console.error('ERROR:', err);
  });