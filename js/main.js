'use strict';

var videoElement = document.querySelector('video');
var videoSelect = document.querySelector('#videoSource');
var takePhotoTimer;

navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(getStream).catch(handleError);

videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'camera ' +
        (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log('Found one other kind of source/device: ', deviceInfo);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  var constraints = {
    video: { deviceId: {exact: videoSelect.value} }
  };

  navigator.mediaDevices.getUserMedia(constraints).
    then(gotStream).catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; 
  videoElement.srcObject = stream;
}

function handleError(error) {
  console.log('Error: ', error);
}

//// screen
const startButton = document.querySelector('#start-button');
const stopButton = document.querySelector('#stop-button');
const canvas = document.createElement('canvas');

startButton.onclick = videoElement.onclick = function() {
  takePhotoTimer = setInterval(takePhoto, 4500);
};

stopButton.onclick = videoElement.onclick = function() {
  clearInterval(takePhotoTimer);
};

function processResult(res) {
  if(res.length>0) {
    let emotions = res[0].faceAttributes.emotion;
    let maxEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
    return maxEmotion[0].toUpperCase() + maxEmotion.slice(1);
  }
  else {
    return "Unknown";
  }
}

function takePhoto(){
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0);
  var img = canvas.toDataURL('image/jpeg');
  processImage(img)
}

//// emotion recognition
function processImage(img) {
  var subscriptionKey = document.getElementById("inputKey").value;
  var uriBase = "https://northeurope.api.cognitive.microsoft.com/face/v1.0/detect";

  var params = {
      "returnFaceId": "true",
      "returnFaceLandmarks": "false",
      "returnFaceAttributes":
          "emotion"
  };

  fetch(img)
    .then(res => res.blob())
    .then(blobData => {
      $.post({
          url: uriBase + "?" + $.param(params),
          contentType: "application/octet-stream",
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': subscriptionKey
          },
          crossDomain: true,
          processData: false,
          data: blobData
        })
        .done(function(data) {
          console.log(data);
          $("#results").text(processResult(data));

        })
        .fail(function(err) {
          $("#results").text(JSON.stringify(err));
        })
    });
};