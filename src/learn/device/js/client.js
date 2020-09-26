'use strict';

// 获取音视频设备
if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices()) {
  console.log('enumerateDevices is not supported!');
} else {
  navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
}


// Promise then
function gotDevices(devicesInfos) {
  const audioSource = document.querySelector('select#audioSource');
  const audioOutput = document.querySelector('select#audioOutput');
  const videoSource = document.querySelector('select#videoSource');

  // 遍历设备，根据类型添加到页面元素中
  devicesInfos.forEach(function(deviceInfo) {
    console.log('kind: ' + deviceInfo.kind +
      ' label: ' + deviceInfo.label +
      ' deviceId: ' + deviceInfo.deviceId +
      ' groupId: ' + deviceInfo.groupId);
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
    }
  });
}

//  Promise catch
function handleError(err) {
  console.log(err.name + ' : ' + err.message);
}