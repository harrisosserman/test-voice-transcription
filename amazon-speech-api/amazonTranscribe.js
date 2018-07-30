var http = require('http')
var AWS = require('aws-sdk');

var s3 = new AWS.S3();

// Bucket names must be unique across all S3 users
var defaultOptionValues = {
  myBucket : "talk-long-example",
  myKey : "long_example.wav",
  LanguageCode: "es-US",
  format: "wav",
  MediaSampleRateHertz: "22050",
  OutputBucketName: "",

}
var httpValues = {
      hostname: 'localhost',
      port: 80,
      path: '/',
      agent: false  // create a new agent just for this one request
    }
var options = {}; 

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

                   console.log("Successfully uploaded data to myBucket/myKey");

               }

            });

         }
        })
    }
// Check for custom or default transcription options
var optionsChecker = (params={}) => {
      params = options;
      if (params !== {}){
        transcription.options = params;
      } else {
          transciption.options = {
            "LanguageCode": defaultOptionValues.LanguageCode,
            "Media": {
              "MediaFileUri": defaultOptionValues.myKey
              },
            "MediaFormat": defaultOptionValues.format,
            "MediaSampleRateHertz" : defaultOptionValues.MediaSampleRateHertz,
            "OutputBucketName": defaultOptionValues.OutputBucketName,
            "TranscriptionJobName": defaultOptionValues.TranscriptionJobName,
            }
      }
    }
var transcription = (param={}) => {   
    // Create an request to start a transcription job to api
    function createVocabulary(params= {}){
      optionsChecker(params)
      http.get(httpValues, (res) => {
      // Do stuff with response
      });
    }
    
    // Send a http get request to get the data from the transcripton bucket
    function getTranscription(params={}){
      // Create a function to present data
      var presentData = (data) => {};
      optionsChecker(params)
      http.get(httpValues, (res) => {
          presentData(res);
      });
    }
    // init Function
    var __init = () => {
      transcription.createVocabulary();
      transcription.getTranscription();
      transcription.presentData();
    }
    //Initialize
    __init();
  }

createBucket(defaultOptionValues.myBucket, defaultOptionValues.myKey);

