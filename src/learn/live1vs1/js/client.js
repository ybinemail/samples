const localVideo = document.querySelector('video#localVideo');
const remoteVideo = document.querySelector('video#remoteVideo');

const inputRoom = document.querySelector('input#room');
const btnJoin = document.querySelector('button#join');
const btnLeave = document.querySelector('button#leave');

let localStream;
let localPC;
let socket;
let state = 'init';

btnJoin.onclick = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('Not suppose WebRTC');
    return;
  }
  const constraints = {
    video: true,
    audio: false
  };
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    // 获取本地媒体流程
    localVideo.srcObject = stream;
    localStream = stream;
    //  创建连接
    conn();
  }).catch((err) => {
    console.log('get User Media error : ', err);
  });
};

function conn() {
  // 创建连接
  socket = io.connect();
  socket.on('joined', (room, id) => {
    console.log('joined room : ' + room + ' socketId : ' + id);
    state = 'joined';
    // 创建连接
    connPeerConnection();
  });

  socket.on('otherjoin', (room, id) => {
    console.log('otherjoin room : ' + room + ' socketId : ' + id);
    if (state === 'joined_unbind') {
      createPeerConnection();
    }
    state = 'joined_conn';
    createOffer();
  });

  socket.on('full', (room, id) => {
    console.log('full room : ' + room + ' socketId : ' + id);
    socket.disconnect();
    state = 'leaved';
  });

  socket.on('leaved', (room, id) => {
    console.log('leaved room : ' + room + ' socketId : ' + id);
    socket.disconnect();
  });

  socket.on('bye', (room, id) => {
    console.log('bye room : ' + room + ' socketId : ' + id);
    state = 'join_unbind';
    closePeerConnection();
  });

  socket.on('message', (data) => {
    console.log('get message : ' + data);
    if (data) {
      if (data.type === 'offer') {
        localPC.getReceivers()
        // 注意文本转为Description对象
        localPC.setRemoteDescription(new RTCSessionDescription(data));
        localPC.createAnswer().then((answerSdp) => {
          // 设置本地
          localPC.setLocalDescription(answerSdp);
          sendMessage(answerSdp);
        }).catch(err => {
          console.error('create answer failed' + err);
        });
      } else if (data.type === 'answer') {
        // 注意文本转为Description对象
        localPC.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.type === 'candidate') {
        // 注意文本转为Candidate对象
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate
        });
        localPC.addIceCandidate(candidate);
      } else {
        console.log('the message is invalid');
      }
    }
  });

  // 加入房间
  room = inputRoom.value;
  socket.emit('join', room);
}

function createOffer() {
  if (state === 'joined_conn' && localPC) {
    const offerOption = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };
    localPC.createOffer(offerOption).then(function(offerSdp) {
      localPC.setLocalDescription(offerSdp);
      sendMessage(offerSdp);
    }).catch(function(reason) {
      console.error('create offer failed' + reason);
    });
  }
}

function connPeerConnection() {
  if (!localPC) {
    const pcConfig = {
      'iceServers': [{
        'urls': 'turn:114.67.123.30:3478',
        'credential': 'demo',
        'username': 'demo'
      }]
    };
    localPC = new RTCPeerConnection(pcConfig);
    localPC.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('find an new candidate', e.candidate);
        // 需要组装candidate
        sendMessage({
          type: 'candidate',
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMid,
          candidate: e.candidate.candidate
        });
      }
    };
    // 获取到远端媒体流程
    localPC.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };
  }
  if (localStream) {
    // 先添加媒体轨到RTCPeerConnection中 再做媒体协商
    localStream.getTracks().forEach((track) => {
      localPC.addTrack(track, localStream);
    });
  }
}

function sendMessage(data) {
  const roomId = inputRoom.value;
  console.log('send message', roomId);
  socket.emit('message', roomId, data);
}

function closePeerConnection() {
  console.log('close peerConnection');
  if (localPC) {
    localPC.close();
    localPC = null;
  }
}

function closeLocalMedia() {
  console.log('close localMedia');
  if (localStream && localStream.getTracks()) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;
}


btnLeave.onclick = () => {
  if (socket) {
    const room = inputRoom.value;
    socket.emit('leave', room);
    closePeerConnection();
    closeLocalMedia();
  }
};

