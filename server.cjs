const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const SerialPort = require('serialport');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Replace with your Arduino’s USB port (we’ll find it below)
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 }, (err) => {
  if (err) {
    console.error('Serial port error:', err.message);
    return;
  }
  console.log('Arduino/HC-05 connected');
});

io.on('connection', (socket) => {
  console.log('React app connected');
  
  socket.on('triggerAlarm', () => {
    console.log('Sending "1" to Arduino');
    port.write('1', (err) => {
      if (err) {
        console.error('Write error:', err.message);
      }
    });
  });
});

server.listen(4000, () => {
  console.log('Bridge running on http://localhost:4000');
});