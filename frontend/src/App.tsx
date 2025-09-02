import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";

export default function App() {
  // 🎥 Reference to the video element (for showing webcam feed)
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 🖼️ Reference to canvas (for capturing images)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const filter = new Image();
  filter.src = "/filters/glasses.png"; // <- path to your filter PNG  


  // 😊 States
  const [emotion, setEmotion] = useState("Waiting..."); // Detected emotion
  const [reply, setReply] = useState("AI reply will appear here"); // AI response
  const [cameraOn, setCameraOn] = useState(false); // Track if camera is ON/OFF
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Store captured image

  // 📦 Load face-api.js models (runs only once when app starts)
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Path to your models folder (inside public/models)
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models"); // Load landmarks model

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

  // 📸 Capture image from video
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Set canvas size = video size
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        
        

        // Draw current video frame into canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert canvas → image URL (base64)
        const imageData = canvas.toDataURL("image/png");
        setCapturedImage(imageData); // Save it in state
      }
    }
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

    {/* Main flex container (Camera | Right side info) */}
    <div className="flex flex-row justify-between items-start w-full max-w-6xl">
      
      {/* LEFT SIDE → Webcam & buttons */}
      <div className="flex flex-col items-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="border border-black rounded-lg shadow-md mb-4 transform scale-x-[-1]"
          width="480"
          height="360"
        />

        {/* Hidden canvas (used for capturing frames) */}
          <canvas ref={canvasRef} className="hidden"></canvas>

        {/* Capture button */}
        <button
          onClick={captureImage}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 mb-2"
        >
          Capture Image
        </button>

        {/* Camera toggle button */}
        <button
          onClick={toggleCamera}
          className={`px-6 py-2 rounded-lg shadow-md mb-4 text-white font-semibold ${
            cameraOn ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </button>

        {/* Show captured image */}
        {capturedImage && (
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">📷 Captured Image:</h2>
            <img
              src={capturedImage}
              alt="Captured"
              className="border rounded-lg shadow-md w-96 transform scale-x-[-1]"
            />

            {/* AI reply below captured image */}
              <div className="bg-white p-4 rounded-lg shadow-md w-96 text-center">
                <h2 className="text-lg font-bold mb-2">Face AI:</h2>
                <p>{reply}</p>
              </div>



          </div>
        )}
      </div>

      {/* RIGHT SIDE → Detected Emotion + AI Reply */}
      <div className="flex flex-col items-center ml-8 w-1/2">
        {/* Detected Emotion */}
        <p className="text-xl font-semibold mb-4">
          Detected Emotion: {emotion}
        </p>

        {/* AI Reply Box */}
        <div className="bg-white p-4 rounded-lg shadow-md w-full text-center">
          <h2 className="text-lg font-bold mb-2">Face AI Reply:</h2>
          <p>{reply}</p>
        </div>
        
          
      </div>
    </div>
  </div>
);

}
