var request = require('request')
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

// Bucket names must be unique across all S3 users
var defaultOptionValues = {
  myBucket : "talk-long-example",
  myKey : "long_example.wav",
  LanguageCode: "es-US",
  format: ".WAV",
  MediaSampleRateHertz: "22050"
};
defaultOptionValues.OutputBucketName = defaultOptionValues.myBucket;

var requestValues = {
        url: url,
        method: "PUT",
        headers: {
          'content-type': "application/json",
          },
        json: options,
    }  

var url = 'http://s3.amazonaws.com/' + defaultOptionValues.myBucket;
var options = {}; 

// Create a bucket for the audio file
function bucketCreator(bucketName, audioFile){
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
// var optionsChecker = (params={}) => {
//       params = options;
//       if (params != {}){
//         options = params;
//       } else {
//           options = {
//             "LanguageCode": defaultOptionValues.LanguageCode,
//             "Media": {
//               "MediaFileUri": defaultOptionValues.myKey
//               },
//             "MediaFormat": defaultOptionValues.format,
//             "MediaSampleRateHertz" : defaultOptionValues.MediaSampleRateHertz,
//             "OutputBucketName": defaultOptionValues.OutputBucketName,
//             "TranscriptionJobName": defaultOptionValues.TranscriptionJobName,
//             }
//       }
//     }
var transcription = (param={}) => {
    var options = {
            "LanguageCode": defaultOptionValues.LanguageCode,
            "Media": {
              "MediaFileUri": defaultOptionValues.myKey
              },
            "MediaFormat": defaultOptionValues.format,
            "MediaSampleRateHertz" : defaultOptionValues.MediaSampleRateHertz,
            "OutputBucketName": defaultOptionValues.OutputBucketName,
            "TranscriptionJobName": defaultOptionValues.TranscriptionJobName,
            }
     
    // Create an request to start a transcription job to api
    function createVocabulary(params= {}){
      // fire request
      request(requestValues, function (error, response, body) {
          if (!error && response.statusCode === 200) {
              console.log(body);
          }
          else {
            errorBody = body;
              console.log("error: " + errorBody)
              console.log("response.statusCode: " + response.statusCode)
              console.log("response.statusText: " + response.statusText)
          }
      })
    }
    
    // // Send a http get request to get the data from the transcripton bucket
    // function getTranscription(params={}){
    //   // Create a function to present data
    //   var presentData = (data) => {};
    //   optionsChecker(params)
    //   http.get(httpValues, (res) => {
    //       presentData(res);
    //   });
    // }
    // init Function
    var __init = () => {
      createVocabulary();
    }
    //Initialize
    __init();
  }
transcription()

