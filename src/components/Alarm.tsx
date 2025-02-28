import React, { useState, useEffect } from "react";

// Declare Bluetooth-related types (for TypeScript compatibility)
declare global {
  interface BluetoothDevice {
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }
  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }
  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: ArrayBuffer): Promise<void>;
  }
}

const Alarm = () => {
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<string>("Disconnected");
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // Connect to HC-05 Bluetooth module
  const connectToBluetooth = async () => {
    try {
      if ("bluetooth" in navigator) {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ name: "HC-05" }],
          optionalServices: ["00001101-0000-1000-8000-00805f9b34fb"], // UART service UUID for HC-05
        });

        const server = await device.gatt?.connect();
        const service = await server?.getPrimaryService("00001101-0000-1000-8000-00805f9b34fb"); // Serial Port UUID
        const char = await service?.getCharacteristic("00001101-0000-1000-8000-00805f9b34fb"); // Same UUID for characteristic
        setBluetoothDevice(device);
        setCharacteristic(char);
        setStatus("Connected to HC-05");
        console.log("Connected to HC-05");
      } else {
        alert("Web Bluetooth API is not supported in this browser.");
      }
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      setStatus("Failed to connect to HC-05");
    }
  };

  // Send command to HC-05
  const sendToMask = async (message: string) => {
    if (characteristic) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message + "\n"); // Add newline to match Arduino's readStringUntil('\n')
      await characteristic.writeValue(data);
      console.log("Sent to HC-05:", message);
    } else {
      console.log("No characteristic available to send data.");
    }
  };

  // Trigger alarm and send ALARM_ON
  const triggerAlarm = async () => {
    setIsRinging(true);
    setStatus("Alarm triggered!");
    if (characteristic) {
      await sendToMask("ALARM_ON");
      if ("vibrate" in navigator) {
        navigator.vibrate(1000); // Vibrate phone for 1 second
        console.log("Phone vibrated!");
      }
    }
  };

  // Stop alarm and send ALARM_OFF
  const stopAlarm = async () => {
    setIsRinging(false);
    setTimeLeft("");
    setStatus("Alarm stopped");
    if (characteristic) {
      await sendToMask("ALARM_OFF");
    }
  };

  // Countdown to alarm
  useEffect(() => {
    if (alarmTime) {
      const interval = setInterval(() => {
        const diff = alarmTime.getTime() - new Date().getTime();
        if (diff <= 0) {
          triggerAlarm(); // Auto-trigger alarm when time is up
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
        <button onClick={triggerAlarm}>Start Alarm (Manual)</button>
        <button onClick={stopAlarm}>Stop Alarm</button>
      </div>
      <div>
        <button onClick={connectToBluetooth}>Connect to HC-05</button>
      </div>
      <div>
        <p>Status: {status}</p>
      </div>
    </div>
  );
};

export default Alarm;