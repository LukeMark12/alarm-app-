import React, { useState, useEffect } from "react";

// Declare BluetoothDevice to avoid TypeScript errors
declare global {
  interface BluetoothDevice {
    name?: string;
    gatt?: BluetoothRemoteGATTServer | null;
  }
}

const Alarm = () => {
  const [isRinging, setIsRinging] = useState<boolean>(false); // To control whether the alarm is ringing or not
  const [alarmTime, setAlarmTime] = useState<Date | null>(null); // To store the alarm time
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null); // To store the Bluetooth device
  const [timeLeft, setTimeLeft] = useState<string>(''); // To store the time remaining for the alarm

  // Function to connect to the Bluetooth mask
  const connectToMask = async () => {
    if ("bluetooth" in navigator) {
      try {
        // Request Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['vibration-service', 'light-service'] }],
        });
        const server = await device.gatt?.connect(); // Connect to the device via GATT
        setBluetoothDevice(device); // Store the Bluetooth device
        console.log("Connected to mask:", device);
      } catch (error) {
        console.error("Failed to connect to Bluetooth device:", error);
      }
    } else {
      console.error("Web Bluetooth API is not supported in this browser.");
    }
  };

  // Function to trigger vibration and light (for both mask and phone)
  const triggerVibrationAndLight = async () => {
    // Bluetooth Mask Logic (if Bluetooth device is connected)
    if (bluetoothDevice) {
      console.log("Vibration triggered on mask!");
      // Add your Bluetooth Vibration and Light logic here
    }

    // Phone Vibration Logic (using Web Vibration API)
    if ("vibrate" in navigator) {
      navigator.vibrate(1000); // Vibrate the phone for 1000ms
      console.log("Vibration triggered on phone!");
    }

    // Phone Light Logic (for devices with flashlight control)
    if ("deviceLight" in navigator) {
      try {
        // Placeholder for controlling the flashlight (pseudo-code)
        // navigator.deviceLight.setLightIntensity(100); 
        console.log("Phone light triggered!");
      } catch (err) {
        console.error("Device light control not supported on this phone.");
      }
    }
  };

  // Function to handle the alarm time input
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0); // Set the alarm time to the selected time
    setAlarmTime(now); // Update the alarm time state
  };

  // Handle the alarm ringing logic
  useEffect(() => {
    if (isRinging) {
      triggerVibrationAndLight(); // Trigger the vibration and light when alarm rings
    }
  }, [isRinging]); // Re-run this effect when `isRinging` changes

  // Update the time remaining until the alarm rings
  useEffect(() => {
    if (alarmTime) {
      const interval = setInterval(() => {
        const diff = alarmTime.getTime() - new Date().getTime();
        if (diff <= 0) {
          setIsRinging(true); // Alarm has rung, trigger the vibration and light
          setTimeLeft('Alarm ringing!');
          clearInterval(interval); // Stop the interval after the alarm rings
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60)); // Calculate hours left
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); // Calculate minutes left
          setTimeLeft(`${hours}h ${minutes}m`); // Update the time left
        }
      }, 1000); // Run every second
      return () => clearInterval(interval); // Cleanup on component unmount
    }
  }, [alarmTime]); // Re-run this effect when the alarm time is updated

  // Function to start the alarm manually (for debugging)
  const startAlarm = () => {
    setIsRinging(true); // Start the alarm manually
  };

  // Function to stop the alarm
  const stopAlarm = () => {
    setIsRinging(false); // Stop the alarm
    setTimeLeft(''); // Reset the time left
  };

  return (
    <div className="alarm-container">
      <h2>Alarm App</h2>
      {/* Time Picker Input */}
      <div>
        <label htmlFor="alarmTime">Set Alarm Time: </label>
        <input
          type="time"
          id="alarmTime"
          onChange={handleTimeChange} // Update alarm time when input changes
        />
      </div>
      {/* Display Time Left */}
      <div>
        <p>Time left until alarm: {timeLeft}</p>
      </div>
      {/* Buttons to start/stop alarm */}
      <div>
        <button onClick={startAlarm}>Start Alarm (Manual)</button>
        <button onClick={stopAlarm}>Stop Alarm</button>
      </div>
      {/* Connect to Mask Button */}
      <div>
        <button onClick={connectToMask}>Connect to Mask</button>
      </div>
      {/* Display connection status */}
      <div>
        {bluetoothDevice ? (
          <p>Connected to: {bluetoothDevice.name}</p>
        ) : (
          <p>Not connected to any device</p>
        )}
      </div>
    </div>
  );
};

export default Alarm;
