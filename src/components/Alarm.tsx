import React, { useState, useEffect } from "react";
import io from "socket.io-client";

// Connect to Node.js server
const socket = io("http://localhost:4000", { autoConnect: true });

const Alarm = () => {
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<string>("Disconnected");
  const [port, setPort] = useState<SerialPort | null>(null);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter | null>(null);

  // Function to connect to HC-05 via Web Serial API
  const connectToHC05 = async () => {
    try {
      if ("serial" in navigator) {
        const serialPort = await (navigator as any).serial.requestPort();
        await serialPort.open({ baudRate: 9600 });
        setPort(serialPort);
        setStatus("Connected to HC-05");

        const textWriter = serialPort.writable.getWriter();
        setWriter(textWriter);

        console.log("Connected to HC-05!");
      } else {
        alert("Web Serial API is not supported in this browser.");
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      setStatus("Connection Failed");
    }
  };

  // Function to send data to HC-05
  const sendDataToHC05 = async (data: string) => {
    if (writer) {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(data));
      console.log("Sent to HC-05:", data);
    }
  };

  // Trigger alarm via Socket.IO and HC-05
  const triggerAlarm = async () => {
    socket.emit("triggerAlarm");
    setStatus("Alarm triggered, signal sent!");

    // Send command to HC-05 (e.g., "VIBRATE")
    await sendDataToHC05("VIBRATE");

    // Phone vibration
    if ("vibrate" in navigator) {
      navigator.vibrate(1000);
      console.log("Phone vibrated!");
    }
  };

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

  // When alarm rings, send signal to HC-05
  useEffect(() => {
    if (isRinging) {
      triggerAlarm();
    }
  }, [isRinging]);

  // Manual alarm controls
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
        <button onClick={connectToHC05}>Connect to HC-05</button>
      </div>
      <div>
        <p>Status: {status}</p>
      </div>
    </div>
  );
};

export default Alarm;
