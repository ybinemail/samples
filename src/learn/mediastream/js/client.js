'use strict';
const audioSource = document.querySelector('select#audioSource');
const audioOutput = document.querySelector('select#audioOutput');
const videoSource = document.querySelector('select#videoSource');
const videoPlay = document.querySelector('video#video');
const filter = document.querySelector('select#filter');

// 获取音视频api接口
function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('get userMedia is not suppose');
  } else {
    const deviceId = videoSource.valueOf();
    // 音视频参数 volume:音量 sampleRate:采样率 sampleSize:采样位数 latency:延迟大小，适当大小可以平滑 channelCount:单双通道 deviceId:设备切换 groupId:物理设备
    // noiseSuppression:true|false 降噪 echoCancellation:true|false 回声消除 autoGainControl:true|false 自动增益
    // 视频参数 width:宽 height:高 frameRate:帧率，帧率高，码流大 facingMode:use|environment|left|right 用户摄像头  reSizeMode:裁剪 deviceId:设备切换 groupId:物理设备
    const constraints = {
      video: {width: 640, height: 480, frameRate: 90, deviceId: deviceId ? deviceId : undefined},
      // audio: {volume: 40, noiseSuppression: true, echoCancellation: true, autoGainControl: true},
      audio: false
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotMediaStream).then(gotDevices).catch(handleErr);
  }

  // Promise then
  function gotDevices(devicesInfos) {
    // 遍历设备，根据类型添加到页面元素中
    devicesInfos.forEach(function(deviceInfo) {
      console.log('kind: ' + deviceInfo.kind +
        ' label: ' + deviceInfo.label +
        ' deviceId: ' + deviceInfo.deviceId +
        ' groupId: ' + deviceInfo.groupId +
        ' for Test');
      // 新选项
      const option = document.createElement('option');
      option.text = deviceInfo.label;
      option.vaule = deviceInfo.deviceId;
      if (deviceInfo.kind === 'audioinput') {
        audioSource.appendChild(option);
      } else if (deviceInfo.kind === 'audiooutput') {
        audioOutput.appendChild(option);
      } else if (deviceInfo.kind === 'videoinput') {
        videoSource.appendChild(option);
      } else {
        console.log('unknown kind');
      }
    });
  }
}

// 对接到通道
function gotMediaStream(stream) {
  videoPlay.srcObject = stream;
  return navigator.mediaDevices.enumerateDevices();
}
// 处理异常
function handleErr(err) {
  console.log('get User Media error : ', err);
}


// 添加出发事件
videoSource.onchange = start;
// 添加渲染事件 通过CSS进行效果渲染
filter.onchange = function() {
  videoPlay.className = filter.value;
};

// 开启
start();
