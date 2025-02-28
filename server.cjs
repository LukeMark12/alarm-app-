const express = require("express");
const BluetoothSerialPort = require("bluetooth-serial-port").BluetoothSerialPort;
const cors = require("cors");

const app = express();
const port = 4000;
const btSerial = new BluetoothSerialPort();

app.use(cors());
app.use(express.json());

let isConnected = false;
let bluetoothAddress = null;

// Scan and connect to HC-05
btSerial.on("found", (address, name) => {
  console.log(`Found device: ${name} (${address})`);
  if (name === "HC-05") {
    bluetoothAddress = address;
    btSerial.findSerialPortChannel(address, (channel) => {
      btSerial.connect(address, channel, () => {
        console.log("✅ Connected to HC-05");
        isConnected = true;
      }, (err) => {
        console.error("❌ Connection error:", err);
      });
    });
  }
});

btSerial.on("failure", (err) => {
  console.error("❌ Bluetooth error:", err);
});

btSerial.inquire(); // Start searching for Bluetooth devices

// API to trigger the alarm
app.post("/trigger", (req, res) => {
  if (!isConnected) return res.status(500).send("❌ HC-05 not connected");
  btSerial.write(Buffer.from("ALARM_ON\n", "utf-8"), (err) => {
    if (err) {
      console.error("❌ Error sending data:", err);
      return res.status(500).send("Failed to trigger alarm");
    }
    console.log("🚨 ALARM_ON sent to HC-05");
    res.send("✅ Alarm triggered");
  });
});

// API to stop the alarm
app.post("/stop", (req, res) => {
  if (!isConnected) return res.status(500).send("❌ HC-05 not connected");
  btSerial.write(Buffer.from("ALARM_OFF\n", "utf-8"), (err) => {
    if (err) {
      console.error("❌ Error sending data:", err);
      return res.status(500).send("Failed to stop alarm");
    }
    console.log("🔕 ALARM_OFF sent to HC-05");
    res.send("✅ Alarm stopped");
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
