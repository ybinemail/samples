'use strict';
const audioSource = document.querySelector('select#audioSource');
const audioOutput = document.querySelector('select#audioOutput');
const videoSource = document.querySelector('select#videoSource');
const videoPlay = document.querySelector('video#video');
const audioPlay = document.querySelector('audio#audio');
// 渲染
const filter = document.querySelector('select#filter');
// 快照
const snapshot = document.querySelector('button#snapshot');
const picture = document.querySelector('canvas#picture');
// 媒体轨
const videoConstraints = document.querySelector('div#constraints');
// 录制
const videoReplayer = document.querySelector('video#replayer');
const btnRecord = document.querySelector('button#record');
const btnReplay = document.querySelector('button#replay');
const btnDownload = document.querySelector('button#download');

picture.width = 320;
picture.height = 240;

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
      // video: false,
      audio: {volume: 40, noiseSuppression: true, echoCancellation: true, autoGainControl: true},
      // audio: false
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotMediaStream).then(gotDevices).catch(handleErr);
  }

  // Promise then
  function gotDevices(devicesInfos) {
    // 遍历设备，根据类型添加到页面元素中
    devicesInfos.forEach(function(deviceInfo) {
      // console.log('kind: ' + deviceInfo.kind + ' label: ' + deviceInfo.label + ' deviceId: ' + deviceInfo.deviceId + ' groupId: ' + deviceInfo.groupId + ' for Test');
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


// **********************************
// MediaStream API 方法
// MediaStream.addTrack() 添加媒体轨
// MediaStream.removeTrack() 移除媒体轨道
// MediaStream.getVideoTracks() 获取全部视频轨
// MediaStream.getAudioTracks() 获取全部音频轨
// MediaStream.stop() 暂停媒体
// **********************************
// MediaStream event 事件
// MediaStream.onaddtrack 添加媒体轨事件
// MediaStream.onremovetrack 移除媒体轨道事件
// MediaStream.onended 结束事件
// **********************************

// 对接到通道
function gotMediaStream(stream) {
  // 获取stream直接赋值,音视频可独立设置
  audioPlay.srcObject = stream;
  videoPlay.srcObject = stream;

  window.stream = stream;

  // 获取视频轨
  const videoTrack = stream.getVideoTracks()[0];
  // 获取视频轨约束
  const videoConstraintsSetting = videoTrack.getSettings();
  videoConstraints.textContent = JSON.stringify(videoConstraintsSetting, null, 2);
  return navigator.mediaDevices.enumerateDevices();
}

// 处理异常
function handleErr(err) {
  console.log('get User Media error : ', err);
}

// 选择事件
videoSource.onchange = start;
// 渲染事件 通过CSS进行效果渲染
filter.onchange = function() {
  // 滤镜效果
  videoPlay.className = filter.value;
};
// 点击快照
snapshot.onclick = function() {
  // 保持快照，添加滤镜功能
  picture.className = filter.value;
  picture.getContext('2d').drawImage(videoPlay, 0, 0, picture.width, picture.height);
};

// 录制
// *****************************
// MediaRecorder API 方法
// MediaRecorder.start(timeslice) 开始录制，如果设置slice，按时间切片存储
// MediaRecorder.stop() 停止录制，出发包括最终Blob数据的dataavailable时间
// MediaRecorder.pause() 暂停
// MediaRecorder.resume() 恢复
// MediaRecorder.isTypeSupported() 类型检查是否支持
// *****************************
// MediaRecorder event 事件
// MediaRecorder.ondataavailalbe;
// 数据有效性事件，有数据时，会定期触发;
// MediaRecorder.onerror;
// 错误发生时，触发;
// *****************************
// JavaScript 存储方式
// 字符串
// Blob 存储区域
// ArrayBuffer
// ArrayBufferView
// *****************************
let buffer;
let mediaRecord;

function startRecord() {
  buffer = [];
  const options = {
    mimeType: 'video/webm;codecs=vp8'
  };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`);
    return;
  }
  try {
    mediaRecord = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Failed to create MediaRecorder:', e);
    return;
  }
  mediaRecord.start(10);

  mediaRecord.ondataavailable = fncHandleDataAvailable;
}

function fncHandleDataAvailable(e) {
  if (e && e.data && e.data.size > 0) {
    buffer.push(e.data);
  }
}

function stopRecord() {
  mediaRecord.stop();
}

// 录制事件
btnRecord.onclick = () => {
  if (btnRecord.textContent === 'Start Record') {
    startRecord();
    btnRecord.textContent = 'Stop Record';
    btnReplay.disable = true;
    btnDownload.disable = true;
  } else {
    stopRecord();
    btnRecord.textContent = 'Start Record';
    btnReplay.disable = false;
    btnDownload.disable = false;
  }
};

btnReplay.onclick = () => {
  const blob = new Blob(buffer, {type: 'video/webm'});
  videoReplayer.src = window.URL.createObjectURL(blob);
  videoReplayer.srcObject = null;
  videoReplayer.controls = true;
  videoReplayer.play();
};

btnDownload.onclick = () => {
  const blob = new Blob(buffer, {type: 'video/webm'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.style.display = 'none';
  a.download = 'aaa.webm';
  a.click();
};

// 开启
start();
