'use strict';
// require
const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
const serveIndex = require('serve-index');
const socketIo = require('socket.io');


const log4js = require('log4js');
log4js.configure({
  appenders: {
    ruleConsole: {type: 'console'},
    ruleFile: {
      type: 'dateFile',
      filename: 'logs/server-',
      pattern: 'yyyy-MM-dd.log',
      maxLogSize: 10 * 1000 * 1000,
      numBackups: 3,
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: {appenders: ['ruleConsole', 'ruleFile'], level: 'debug'}
  }
});
const logger = log4js.getLogger('normal');

// express
const app = express();
app.use(serveIndex('../', {'icons': true}));
app.use(express.static('../'));

// http server
const httpServer = http.createServer(app);
httpServer.listen(8080, '0.0.0.0');
console.log('serving on http://localhost:8443');

// https server
const options = {
  key: fs.readFileSync('../certs/server.pem'),
  cert: fs.readFileSync('../certs/server.pem')
};
const httpsServer = https.createServer(options, app);
// socket io
const io = socketIo.listen(httpsServer);
io.sockets.on('connection', listenEvent);
httpsServer.listen(8443, '0.0.0.0');
console.log('serving on https://localhost:8443');

// ******************************
// Socket io API
// 服务端发送消息：
// socket.emit() 给本次连接发消息
// io.in(room).emit() 给某个房间内所有人发消息
// socket.to(room).emit() 除本连接外，给某个房间内所有人发消息
// socket.broadcast.emit() 除本连接外，给所有人发消息
//
// 客户端处理消息：
// 发送action命令
// S: socket.emit('action')
// C: socket.on('action',function(){...})
//
// 发送了一个action命令，并带有一个数据
// S：socket.emit('action',data)
// C: socket.on('action',function(data){...})
//
//
// 发送了一个action命令，并带有数据
// S：socket.emit('action',data1,data2)
// C: socket.on('action',function(data1,data2){...})
//
//
// 发送了一个action命令，在emit方法中，包含了回调函数
// S：socket.emit('action',data,function(arg1,arg2){...})
// C: socket.on('action',function(data,fn){
//   fn('arg1','arg2')
// })
// ******************************


// listen
function listenEvent(socket) {
  console.log('has a connection !!! ', socket.id);
  socket.on('join', (room) => {
    // 加入room
    socket.join(room);
    logger.info('===> join room : ' + room);
    // 根据room找到该房间
    const myRoom = io.sockets.adapter.rooms[room];
    // 该房间下所有人
    const users = Object.keys(myRoom.sockets).length;
    logger.info('the number of user in room is : ' + users);
    if (users < 3) {
      socket.emit('joined', room, socket.id); // 给本次连接发消息
      if (users > 1) {
        socket.to(room).emit('otherjoin', room, socket.id); // 通知其他人
      }
      // io.in(room).emit('joined', room, socket.id); // 给某个房间内所有人发消息
      // socket.to(room).emit('joined', room, socket.id); // 除本连接外，给某个房间内所有人发消息
      // socket.broadcast.emit('joined', room, socket.id); // 除本连接外，给所有人发消息
    } else {
      // 移除
      socket.leave(room);
      // 回复消息
      socket.emit('full', room, socket.id); // 给本次连接发消息
    }
  });

  socket.on('leave', (room) => {
    // 根据room找到该房间
    const myRoom = io.sockets.adapter.rooms[room];
    // 该房间下所有人
    let users = Object.keys(myRoom.sockets).length;
    users = users - 1;
    logger.log('the number of user in room is : ' + users);

    socket.leave(room);
    logger.log('===> leave room : ' + room);

    socket.to(room).emit('bye', room, socket.id);
    // 回复消息
    socket.emit('leaved', room, socket.id); // 给本次连接发消息
    // io.in(room).emit('leave', room, socket.id); // 给某个房间内所有人发消息
    // socket.to(room).emit('leave', room, socket.id); // 除本连接外，给某个房间内所有人发消息
    // socket.broadcast.emit('leave', room, socket.id); // 除本连接外，给所有人发消息
  });

  socket.on('message', (room, data) => {
    logger.info('get message : ' + data + 'from room : ' + room);
    socket.to(room).emit('message', data);
  });


  socket.on('disconnect', function(msg) {
    console.log('DISCONNESSO!!! reason : ' + msg + ',id: ' + socket.id);
  });
}
