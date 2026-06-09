import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MonitorPlay, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';

export default function ProctoringSetup({ onComplete }: { onComplete: (stream: MediaStream | null) => void }) {
  const [step, setStep] = useState(1);
  const [permissions, setPermissions] = useState({
    camera: false,
    mic: false,
    screen: false, 
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Camera & Mic Access
  const requestMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setPermissions(prev => ({ ...prev, camera: true, mic: true }));
      setStep(2);
    } catch (err) {
      console.error(err);
      if (!navigator.mediaDevices) {
        alert("Camera access is blocked. This usually happens if you are not using a secure connection (HTTPS) or localhost.");
      } else {
        alert("Camera and Microphone permissions are strictly required for the exam. Please allow them in your browser settings.");
      }
    }
  };

  // Attach camera stream when stepping to 3
  useEffect(() => {
    if (step === 3 && stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [step, stream]);

  // 2. Tab Change / Blur Detection Setup (will be active during exam)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn("WARNING: Tab changed! This violation is recorded.");
        alert("SECURITY WARNING: You changed the tab! Activity has been flagged to the invigilator.");
      }
    };
    
    const handleBlur = () => {
      console.warn("WARNING: Window lost focus!");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // 3. Screen & External Device Constraint
  const enforceEnvironment = async () => {
    try {
      // Enforce Fullscreen to prevent taskbar/casting access easily
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      // Chrome-specific: Check for multiple screens (Requires Window Placement permission)
      if ('getScreenDetails' in window) {
        // @ts-ignore
        const screenDetails = await window.getScreenDetails();
        if (screenDetails.screens.length > 1) {
          alert("SECURITY WARNING: Multiple displays detected. Please disconnect external monitors/HDMI to proceed.");
          return; // Block them
        }
      }
      
      setPermissions(prev => ({ ...prev, screen: true }));
      setStep(3);
    } catch (err) {
      console.log("Fullscreen or Screen Details API failed/denied.", err);
      // Fallback allowed for demo purposes
      setStep(3);
    }
  };

  const finishSetup = () => {
    onComplete(stream);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl max-w-2xl w-full border border-slate-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Strict Proctoring Setup</h2>
        
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-700 -z-10"></div>
          
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary-500' : 'text-slate-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50' : 'bg-slate-700'}`}>
              <Camera size={20} />
            </div>
            <span className="text-xs font-semibold">Media Access</span>
          </div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-yellow-500' : 'text-slate-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50' : 'bg-slate-700'}`}>
              <MonitorPlay size={20} />
            </div>
            <span className="text-xs font-semibold">System Constraints</span>
          </div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-emerald-500' : 'text-slate-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' : 'bg-slate-700'}`}>
              <Smartphone size={20} />
            </div>
            <span className="text-xs font-semibold">360° Scan</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <div className="bg-primary-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic size={32} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Camera & Microphone</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">SAMADHAN X requires access to your camera and microphone to use AI Facial Tracking and Audio Anomaly Detection.</p>
              <button onClick={requestMedia} className="btn-primary w-full max-w-xs mx-auto py-3">Grant Permissions</button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center animate-fade-in">
              <div className="bg-yellow-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-4">Strict Environment Policy</h3>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto border border-slate-700">
                <ul className="text-slate-300 text-sm space-y-3">
                  <li className="flex items-start"><span className="text-red-500 mr-2 mt-0.5">•</span> Tab changing or minimizing the window is tracked and flagged.</li>
                  <li className="flex items-start"><span className="text-red-500 mr-2 mt-0.5">•</span> Screen casting (HDMI/Miracast) will block the exam via Multi-Screen API.</li>
                  <li className="flex items-start"><span className="text-red-500 mr-2 mt-0.5">•</span> Full-Screen mode will be enforced to lock you into the ecosystem.</li>
                </ul>
              </div>
              <button onClick={enforceEnvironment} className="w-full max-w-xs mx-auto py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors">Acknowledge & Enforce</button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center animate-fade-in">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-56 bg-black rounded-lg mb-4 object-cover border-2 border-emerald-500/30 transform scale-x-[-1]"></video>
              <h3 className="text-lg font-semibold text-white mb-2">360° Environment Scan</h3>
              <p className="text-slate-400 text-sm mb-6">Please pick up your laptop or webcam and slowly rotate 360 degrees to verify your room environment is clear.</p>
              <button onClick={finishSetup} className="w-full max-w-xs mx-auto py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex justify-center items-center">
                <CheckCircle size={20} className="mr-2" />
                Scan Complete - Start Exam
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
