"use client";

import { useState, useEffect, useRef } from "react";
import { Device } from "twilio-client";

export default function TwilioVoiceClient() {
  const [device, setDevice] = useState<Device | null>(null);
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [isMuted, setIsMuted] = useState(false);
  const connectionRef = useRef<any>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    let currentDevice: Device | null = null;

    async function setupDevice() {
      try {
        console.log("Setting up Twilio device...");

        // First, get microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Get available audio output devices
        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputs = devices.filter(
            (device) => device.kind === "audiooutput"
          );
          if (mounted) {
            setAudioDevices(audioOutputs);
            if (audioOutputs.length > 0) {
              setSelectedAudioOutput(audioOutputs[0].deviceId);
            }
          }
        }

        // Get token from server
        const response = await fetch("/api/twilio/token");
        if (!response.ok) {
          throw new Error(`Failed to get token: ${response.status}`);
        }

        const data = await response.json();
        if (!data.token) {
          throw new Error("No token received from server");
        }

        console.log("Token received, initializing device");

        // Create new device
        const newDevice = new Device();
        currentDevice = newDevice;

        // Set up event handlers
        newDevice.on("ready", () => {
          if (!mounted) return;
          console.log("✅ Twilio device is ready");
          setStatus("Ready");
        });

        newDevice.on("error", (error) => {
          if (!mounted) return;
          console.error("❌ Twilio device error:", error);
          setStatus(`Error: ${error.message}`);
        });

        newDevice.on("connect", (conn) => {
          if (!mounted) return;
          console.log("📞 Call connected", conn);
          connectionRef.current = conn;

          // Set volume to maximum
          conn.volume(1);

          // Set up connection event handlers
          conn.on("volume", (vol: number) => {
            console.log(`Volume changed: ${vol}`);
          });

          conn.on("warning", (warning: { message: string }) => {
            console.warn(`Connection warning: ${warning.message}`);
          });

          conn.on("error", (error: { message: string }) => {
            console.error(`Connection error: ${error.message}`);
          });

          setStatus("On call");
        });

        newDevice.on("disconnect", () => {
          if (!mounted) return;
          console.log("📞 Call disconnected");
          connectionRef.current = null;
          setStatus("Ready");
        });

        // Initialize the device with the token
        await newDevice.setup(data.token, {
          debug: true,
          warnings: true,
          allowIncomingWhileBusy: false,
        });

        if (mounted) {
          setDevice(newDevice);
          setStatus("Ready");
        }
      } catch (error) {
        if (!mounted) return;
        console.error("❌ Setup error:", error);
        setStatus(
          `Setup failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    setupDevice();

    // Cleanup function
    return () => {
      mounted = false;
      if (currentDevice) {
        console.log("Cleaning up Twilio device");
        currentDevice.destroy();
      }
    };
  }, []);

  // Change audio output device if supported
  useEffect(() => {
    if (!selectedAudioOutput || !connectionRef.current) return;

    try {
      if (
        connectionRef.current.mediaStream &&
        connectionRef.current.mediaStream.setSinkId
      ) {
        connectionRef.current.mediaStream
          .setSinkId(selectedAudioOutput)
          .then(() =>
            console.log(`Audio output set to: ${selectedAudioOutput}`)
          )
          .catch((err: Error) =>
            console.error("Error setting audio output:", err)
          );
      }
    } catch (err: unknown) {
      console.error("Error changing audio output:", err);
    }
  }, [selectedAudioOutput, connectionRef.current]);

  const makeCall = async () => {
    if (!device || !number || connectionRef.current) return;

    try {
      console.log(`📞 Making call to ${number}`);
      setStatus("Connecting...");

      // Params for the call
      const params: Record<string, string> = {
        To: number,
        // Add any additional parameters needed for your TwiML app
      };

      // Connect and store the connection
      connectionRef.current = await device.connect(params);
      console.log("Call initiated:", connectionRef.current);
    } catch (error) {
      console.error("❌ Call error:", error);
      setStatus(
        `Call failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const hangUp = () => {
    console.log("Hanging up call");
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    } else if (device) {
      device.disconnectAll();
    }
  };

  const toggleMute = () => {
    if (!connectionRef.current) return;

    if (isMuted) {
      connectionRef.current.mute(false);
      setIsMuted(false);
      console.log("Unmuted call");
    } else {
      connectionRef.current.mute(true);
      setIsMuted(true);
      console.log("Muted call");
    }
  };

  const isOnCall = status === "On call" || status === "Connecting...";

  return (
    <div className="p-4 max-w-sm mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Twilio Voice Client</h2>

      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="font-medium">
          Status:{" "}
          <span
            className={
              status === "Ready"
                ? "text-green-600"
                : status.includes("Error")
                ? "text-red-600"
                : "text-blue-600"
            }
          >
            {status}
          </span>
        </p>
      </div>

      <div className="mb-4">
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone Number
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="+1234567890"
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isOnCall}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter full number with country code (e.g., +1 for US)
        </p>
      </div>

      {audioDevices.length > 0 && (
        <div className="mb-4">
          <label
            htmlFor="audioOutput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Audio Output
          </label>
          <select
            id="audioOutput"
            value={selectedAudioOutput}
            onChange={(e) => setSelectedAudioOutput(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isOnCall}
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${device.deviceId.substr(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex space-x-2">
        {!isOnCall ? (
          <button
            onClick={makeCall}
            disabled={!device || !number || status !== "Ready"}
            className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Call
          </button>
        ) : (
          <>
            <button
              onClick={hangUp}
              className="flex-1 p-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Hang Up
            </button>
            <button
              onClick={toggleMute}
              className={`p-2 ${
                isMuted
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white rounded focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
