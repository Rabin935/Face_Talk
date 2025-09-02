import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";

export default function App() {
  // 🎥 Reference to the video element for webcam feed
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 🖼️ Reference to hidden canvas for drawing/capturing images
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🕶️ Filter images
  const glassfilter = new Image();
  glassfilter.src = "/filters/glasses.png"; // glasses filter

  const hat = new Image();
  hat.src = "/filters/hat.png"; // hat filter

  // 😊 React states
  const [emotion, setEmotion] = useState("Waiting..."); // Current detected emotion
  const [reply, setReply] = useState("AI reply will appear here"); // AI reply text
  const [cameraOn, setCameraOn] = useState(false); // Camera ON/OFF state
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Captured image data

  // 📦 Load face-api.js models (runs once)
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Path to models folder in public/
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // Needed for filters
    };

    loadModels();
  }, []);

  // ▶️ Start the webcam
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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

  

  // 🔘 Toggle camera ON/OFF
  const toggleCamera = () => {
    if (cameraOn) stopVideo();
    else startVideo();
    setCameraOn(!cameraOn);
  };

  // 📸 Capture the current frame from video (with filters if applied)
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas to video dimensions
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw video frame
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image and store in state
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
  };

  // 😃 Detect emotions & apply filters every 100ms (10 FPS)
  useEffect(() => {
  let interval: ReturnType<typeof setInterval>;

  const detectAndDraw = async () => {
    if (!cameraOn || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Draw video frame
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Detect face + landmarks
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detection) {
      const landmarks = detection.landmarks;

      // Glasses filter on eyes
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      if (leftEye.length && rightEye.length) {
        const eyeWidth = rightEye[3].x - leftEye[0].x;
        const eyeHeight = eyeWidth / 2;
        const eyeX = leftEye[0].x;
        const eyeY = leftEye[0].y - eyeHeight / 2;
        context.drawImage(glassfilter, eyeX, eyeY, eyeWidth, eyeHeight);
      }

      // Hat filter on forehead
      const nose = landmarks.getNose();
      if (nose.length) {
        const hatWidth = canvas.width / 2;
        const hatHeight = hatWidth / 2;
        const hatX = nose[0].x - hatWidth / 2;
        const hatY = nose[0].y - hatHeight * 1.5;
        context.drawImage(hat, hatX, hatY, hatWidth, hatHeight);
      }

      // Update emotion and send to backend
      const expressions = detection.expressions;
      const maxEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      setEmotion(maxEmotion);
      sendToBackend(maxEmotion);
    }
  };

  interval = setInterval(detectAndDraw, 100); // 10 FPS

  return () => clearInterval(interval);
}, [cameraOn]);


  // 🔗 Send emotion to Flask backend
  const sendToBackend = async (detectedEmotion: string) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/get-reply", {
        emotion: detectedEmotion,
      });
      setReply(res.data.reply);
    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  // 🎨 UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-4 text-center">😊 FaceTalk</h1>

      {/* Main flex container */}
      <div className="flex flex-row justify-between items-start w-full max-w-6xl">
        {/* LEFT SIDE → Webcam & buttons */}
        <div className="flex flex-col items-center">
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            className="border border-black rounded-lg shadow-md mb-4 transform scale-x-[-1]"
            width="480"
            height="360"
          />

          {/* Hidden canvas for drawing frames */}
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

          {/* Display captured image & AI reply */}
          {capturedImage && (
            <div className="mb-4">
              <h2 className="text-lg font-bold mb-2">📷 Captured Image:</h2>
              <img
                src={capturedImage}
                alt="Captured"
                className="border rounded-lg shadow-md w-96 transform scale-x-[-1]"
              />
              <div className="bg-white p-4 rounded-lg shadow-md w-96 text-center mt-2">
                <h2 className="text-lg font-bold mb-2">Face AI:</h2>
                <p>{reply}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE → Detected Emotion + AI Reply */}
        <div className="flex flex-col items-center ml-8 w-1/2">
          <p className="text-xl font-semibold mb-4">
            Detected Emotion: {emotion}
          </p>
          <div className="bg-white p-4 rounded-lg shadow-md w-full text-center">
            <h2 className="text-lg font-bold mb-2">Face AI Reply:</h2>
            <p>{reply}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
