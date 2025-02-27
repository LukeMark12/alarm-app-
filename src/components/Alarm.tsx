import React, { useState, useEffect } from "react";

// Declare Bluetooth device type (for TypeScript compatibility)
declare global {
  interface BluetoothDevice {
    name?: string;
    gatt?: BluetoothRemoteGATTServer | null;
  }
}

const Alarm = () => {
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<string>("Disconnected");
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter | null>(null); // Bluetooth writer

  // Function to connect to the Bluetooth mask (HC-05)
  const connectToBluetooth = async () => {
    try {
      if ("bluetooth" in navigator) {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ name: "HC-05" }], // Or a specific name if you know the HC-05's name
          optionalServices: ['device_information'], // You can add more services if needed
        });

        const server = await device.gatt?.connect(); // Connect to HC-05
        const service = await server?.getPrimaryService('device_information'); // Optional service
        const characteristic = await service?.getCharacteristic('device_name'); // Optional characteristic
        setBluetoothDevice(device); // Set the connected device
        setStatus("Connected to Bluetooth Mask");

        // Get the writable stream for sending data
        const writer = device.gatt?.getWriter();
        setWriter(writer);
      } else {
        alert("Web Bluetooth API is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error connecting to Bluetooth:", error);
      setStatus("Failed to connect to Bluetooth Mask");
    }
  };

  // Function to send commands to the Bluetooth mask (e.g., "ALARM_ON")
  const sendToMask = async (message: string) => {
    if (writer) {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(message));
      console.log("Message sent to mask:", message);
    }
  };

  // Trigger alarm and send signal to Bluetooth mask
  const triggerAlarm = async () => {
    setStatus("Alarm triggered!");
    // Send the ALARM_ON signal to the mask via Bluetooth
    if (bluetoothDevice) {
      await sendToMask("ALARM_ON"); // Send ALARM_ON signal to mask

      // Vibration on phone (optional)
      if ("vibrate" in navigator) {
        navigator.vibrate(1000); // Vibration for 1 second
        console.log("Phone vibrated!");
      }
    }
  };

  // Countdown to alarm
  useEffect(() => {
    if (alarmTime) {
      const interval = setInterval(() => {
        const diff = alarmTime.getTime() - new Date().getTime();
        if (diff <= 0) {
          setIsRinging(true);
          setTimeLeft("Alarm ringing!");
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [alarmTime]);

  // Handle alarm time input
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    if (now < new Date()) now.setDate(now.getDate() + 1);
    setAlarmTime(now);
    setStatus(`Alarm set for ${now.toLocaleTimeString()}`);
  };

  // Start and stop alarm controls
  const startAlarm = () => setIsRinging(true);
  const stopAlarm = () => {
    setIsRinging(false);
    setTimeLeft("");
    setStatus("Alarm stopped");
  };

  return (
    <div className="alarm-container" style={{ textAlign: "center", padding: "20px" }}>
      <h2>Alarm App</h2>
      <div>
        <label htmlFor="alarmTime">Set Alarm Time: </label>
        <input type="time" id="alarmTime" onChange={handleTimeChange} />
      </div>
      <div>
        <p>Time left until alarm: {timeLeft}</p>
      </div>
      <div>
        <button onClick={startAlarm}>Start Alarm (Manual)</button>
        <button onClick={stopAlarm}>Stop Alarm</button>
      </div>
      <div>
        <button onClick={connectToBluetooth}>Connect to Mask</button>
      </div>
      <div>
        <p>Status: {status}</p>
      </div>
    </div>
  );
};

export default Alarm;
