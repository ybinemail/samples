'use strict';


const localVideo = document.querySelector('video#localVideo');
const remoteVideo = document.querySelector('video#remoteVideo');
const btnStart = document.querySelector('button#start');
const btnCall = document.querySelector('button#call');
const btnEnd = document.querySelector('button#end');

const areaOffer = document.querySelector('textarea#offer');
const areaAnswer = document.querySelector('textarea#answer');
let localStream;
let localPC;
let remotePC;


function getOffer(offerSdp) {
  areaOffer.textContent = offerSdp.sdp;
  localPC.setLocalDescription(offerSdp);

  remotePC.setRemoteDescription(offerSdp);

  remotePC.createAnswer().then(getAnswer).catch(function(reason) {
    console.error('create answer failed' + reason);
  });
}

function getAnswer(answerSdp) {
  areaAnswer.textContent = answerSdp.sdp;
  remotePC.setLocalDescription(answerSdp);

  localPC.setRemoteDescription(answerSdp);
}


btnStart.onclick = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('Not suppose WebRTC');
    return;
  }
  const constraints = {
    video: true,
    audio: false
  };
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    localVideo.srcObject = stream;
    localStream = stream;
  }).catch((err) => {
    console.log('get User Media error : ', err);
  });
};

btnCall.onclick = () => {
  localPC = new RTCPeerConnection();
  localPC.onicecandidate = (e) => {
    if (e.candidate) {
      remotePC.addIceCandidate(e.candidate).catch(e => {
        console.log('Failure during localPC addIceCandidate(): ' + e.name);
      });
    }
  };

  remotePC = new RTCPeerConnection();
  remotePC.onicecandidate = (e) => {
    if (e.candidate) {
      localPC.addIceCandidate(e.candidate).catch(e => {
        console.log('Failure during remotePC addIceCandidate(): ' + e.name);
      });
    }
  };

  remotePC.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // 先添加媒体轨到RTCPeerConnection中 再做媒体协商
  localStream.getTracks().forEach((track) => {
    localPC.addTrack(track, localStream);
  });

  const offerOption = {
    offerToReceiveAudio: false,
    offerToReceiveVideo: true
  };
  localPC.createOffer(offerOption).then(getOffer).catch(function(reason) {
    console.error('create offer failed' + reason);
  });
};

btnEnd.onclick = () => {
  localPC.close();
  remotePC.close();
  localPC = null;
  remotePC = null;
};
