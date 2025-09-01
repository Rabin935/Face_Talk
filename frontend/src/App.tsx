import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";


export default function App() {
  // 🎥 Reference to the video element (for showing webcam feed)
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 😊 States
  const [emotion, setEmotion] = useState("Waiting..."); // Detected emotion
  const [reply, setReply] = useState("AI reply will appear here"); // AI response
  const [cameraOn, setCameraOn] = useState(false); // Track if camera is ON/OFF

  // 📦 Load face-api.js models (runs only once when app starts)
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Path to your models folder (inside public/models)
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  // ▶️ Start the webcam
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} }) // Ask for webcam access
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream; // Attach webcam feed to <video>
        }
      })
      .catch((err) => console.error("Webcam error:", err));
  };

  // ⏹️ Stop the webcam
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop()); // Stop all video tracks
      videoRef.current.srcObject = null; // Clear video feed
    }
  };

  // 🔘 Toggle button for starting/stopping the camera
  const toggleCamera = () => {
    if (cameraOn) {
      stopVideo();
    } else {
      startVideo();
    }
    setCameraOn(!cameraOn); // Flip camera state (true/false)
  };

  // 😃 Detect emotions every 2 seconds (only if camera is on)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (cameraOn && videoRef.current) {
        // Detect face + expressions
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detection && detection.expressions) {
          // Pick the emotion with the highest probability
          const expressions = detection.expressions;
          const maxEmotion = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );

          setEmotion(maxEmotion); // Update emotion on screen
          sendToBackend(maxEmotion); // Send emotion to Flask backend
        }
      }
    }, 2000); // Run every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [cameraOn]);

  // 🔗 Send detected emotion to Flask backend and get AI reply
  const sendToBackend = async (detectedEmotion: string) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/get-reply", {
        emotion: detectedEmotion,
      });
      setReply(res.data.reply); // Show AI reply
    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  // 🎨 UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-4 text-center">😊 FaceTalk</h1>

      {/* Webcam feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="border-4 border-black-300 rounded-lg shadow-md mb-4 mirror"
        width="480"
        height="360"
      />

      {/* ✅ Camera toggle button */}
      <button
        onClick={toggleCamera}
        className={`px-6 py-2 rounded-lg shadow-md mb-4 text-white font-semibold ${
          cameraOn ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {cameraOn ? "Stop Camera" : "Start Camera"}
      </button>

      {/* Show detected emotion */}
      <p className="text-xl font-semibold mb-2">Detected Emotion: {emotion}</p>

      {/* Show AI reply */}
      <div className="bg-white p-4 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-lg font-bold mb-2">AI Reply:</h2>
        <p>{reply}</p>
      </div>

      <button
  className="text-black bg-blue-500 font-bold px-6 py-2 rounded-xl shadow-md 
         hover:bg-blue-600 hover:shadow-lg hover:border-none 
         transition-all duration-100 ease-in-out"
>
  Touch
</button>

<div className="text-3x1 font-bold text-blue-600
>             hover:scale-150 transition-all duration-200 ease-in-out hover:text-red-600">
      Hello world!
    </div>
    </div>

    
  );
}
