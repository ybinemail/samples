'use strict';

const username = document.querySelector('input#username');
const inputRoom = document.querySelector('input#room');
const btnConnect = document.querySelector('button#connect');
const outputArea = document.querySelector('textarea#output');
const inputArea = document.querySelector('textarea#input');
const btnSend = document.querySelector('button#send');


var socket;
var room;
btnConnect.onclick = () => {
  socket = io.connect();

  socket.on('joined', (room, id) => {
    btnConnect.disabled = true;
    inputArea.disabled = false;
    btnSend.disabled = false;
    console.log('joined room : ' + room + ' socketId : ' + id);
  });

  socket.on('leaved', (room, id) => {
    btnConnect.disabled = false;
    inputArea.disabled = true;
    btnSend.disabled = true;
    console.log('leaved room : ' + room + ' socketId : ' + id);
  });

  socket.on('message', (room, id, data) => {
    console.log('get message : ' + data + ' from room : ' + room + 'socketId : ' + id);
    outputArea.value = outputArea.value + data + '\r';
  });

  room = inputRoom.value;
  socket.emit('join', room);
};

btnSend.onclick = () => {
  let value = inputArea.value;
  value = username.value + ':' + value;
  socket.emit('message', room, value);
  inputArea.value = '';
};