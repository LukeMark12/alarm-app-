import React, { useState, useEffect } from "react";

// Helper function to calculate the difference in milliseconds between two times
const getTimeDifferenceInMs = (alarmTime: Date) => {
  const currentTime = new Date();
  let diff = alarmTime.getTime() - currentTime.getTime();

  // If the alarm time is earlier today, adjust to the next day
  if (diff < 0) {
    diff += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
  }

  return diff;
};

const Alarm = () => {
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Function to connect to the Bluetooth mask
  const connectToMask = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['vibration-service', 'light-service'] }],
      });
      const server = await device.gatt?.connect();
      const vibrationChar = await server?.getCharacteristic('vibration-characteristic');
      const lightChar = await server?.getCharacteristic('light-characteristic');
      setBluetoothDevice(device);
      console.log("Connected to mask:", device);
    } catch (error) {
      console.error("Failed to connect to Bluetooth device:", error);
    }
  };

  // Function to trigger vibration on the mask
  const triggerVibration = async () => {
    if (bluetoothDevice) {
      const vibrationChar = await getVibrationCharacteristic();
      if (vibrationChar) {
        const vibrationSignal = new Uint8Array([1]); // Trigger vibration on the mask
        await vibrationChar.writeValue(vibrationSignal);
        console.log("Vibration triggered on mask!");
      }
    }

    // Trigger vibration on the phone (for mobile users)
    if ("vibrate" in navigator) {
      // Vibrate for 1000ms on the phone
      navigator.vibrate(1000);
      console.log("Vibration triggered on phone!");
    }
  };

  // Function to trigger fading light on the mask
  const fadeLight = async () => {
    if (bluetoothDevice) {
      const lightChar = await getLightCharacteristic();
      if (lightChar) {
        let intensity = 0;
        const interval = setInterval(async () => {
          intensity += 5; // Increase light intensity
          if (intensity >= 100) {
            clearInterval(interval); // Stop after reaching max intensity
          }
          await lightChar.writeValue(new Uint8Array([intensity]));
        }, 100); // Increase light intensity gradually
        console.log("Light fade triggered on mask!");
      }
    }

    // Trigger light on phone (for compatible devices)
    if ("deviceLight" in navigator) {
      try {
        // Assuming your app can control light (This is pseudo-code, for illustrative purposes)
        // navigator.deviceLight.setLightIntensity(100); 
        console.log("Phone light triggered!");
      } catch (err) {
        console.error("Device light control not supported on this phone.");
      }
    }
  };

  // Retrieve the vibration characteristic
  const getVibrationCharacteristic = async () => {
    if (!bluetoothDevice) return null;
    const server = await bluetoothDevice.gatt?.connect();
    return server?.getCharacteristic('vibration-characteristic');
  };

  // Retrieve the light characteristic
  const getLightCharacteristic = async () => {
    if (!bluetoothDevice) return null;
    const server = await bluetoothDevice.gatt?.connect();
    return server?.getCharacteristic('light-characteristic');
  };

  // Handle the alarm ringing logic
  useEffect(() => {
    if (isRinging) {
      triggerVibration();
      fadeLight();
    }
  }, [isRinging]);

  // Update the time remaining until the alarm rings
  useEffect(() => {
    if (alarmTime) {
      const interval = setInterval(() => {
        const diff = alarmTime.getTime() - new Date().getTime();
        if (diff <= 0) {
          setIsRinging(true);
          setTimeLeft('Alarm ringing!');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      }, 1000);
      return () => clearInterval(interval); // Cleanup on component unmount
    }
  }, [alarmTime]);

  // Function to handle alarm time input
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0); // Set the alarm time to the selected time
    setAlarmTime(now);
  };

  // Function to start the alarm manually (for debugging)
  const startAlarm = () => {
    setIsRinging(true);
  };

  // Function to stop the alarm
  const stopAlarm = () => {
    setIsRinging(false);
    setTimeLeft('');
  };

  return (
    <div className="alarm-container">
      <h2>Alarm App</h2>
      <div>
        {/* Time Picker Input */}
        <label htmlFor="alarmTime">Set Alarm Time: </label>
        <input
          type="time"
          id="alarmTime"
          onChange={handleTimeChange}
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
