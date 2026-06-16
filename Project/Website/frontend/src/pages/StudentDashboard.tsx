import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, MapPin, Clock, Bot, UserCheck, FileText, AlertTriangle, Lock, Smartphone, X, LogOut } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SeatMap3D from '../components/SeatMap3D';
import ProctoringSetup from '../components/ProctoringSetup';
import { FaceLandmarker, ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

declare global {
  interface Window {
    electronAPI?: {
      startExam: () => void;
      endExam: () => void;
    };
  }
}

export default function StudentDashboard() {
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOcrStatus('processing');
      setTimeout(() => setOcrStatus('done'), 2000);
    }
  };

  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello John! I\'m your Samadhan assistant. How can I help you with your upcoming Advanced Algorithms exam or anything related to education?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [show3DMap, setShow3DMap] = useState(false);
  const [showProctoring, setShowProctoring] = useState(() => {
    return sessionStorage.getItem('show_proctoring') === 'true';
  });
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (showProctoring) {
      sessionStorage.setItem('show_proctoring', 'true');
    } else {
      sessionStorage.removeItem('show_proctoring');
    }
  }, [showProctoring]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [examTerminated, setExamTerminated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [show360Toast, setShow360Toast] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const prevQuestion = useRef(0);

  const studentName = localStorage.getItem('auth_name') || 'Student';
  const studentEmail = localStorage.getItem('auth_email') || 'student@example.com';

  const [warnings, setWarnings] = useState(0);
  const [proctorMessage, setProctorMessage] = useState("Initializing Proctoring...");
  const [materialsVerified, setMaterialsVerified] = useState(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const requestRef = useRef<number>(0);
  const violationCooldown = useRef(false);

  useEffect(() => {
    const initModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 5
        });
        
        objectDetectorRef.current = await ObjectDetector.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
            delegate: "GPU"
          },
          scoreThreshold: 0.5,
          runningMode: "VIDEO"
        });

        setProctorMessage("Please show your Pen & Copy to the camera");
      } catch (e) {
        console.error("Failed to load MediaPipe models", e);
      }
    };
    initModel();
  }, []);

  const questions = [
    { id: 1, text: "Which of the following sorting algorithms has the best average-case time complexity?", options: ["Quick Sort", "Bubble Sort", "Insertion Sort", "Selection Sort"] },
    { id: 2, text: "In a binary search tree, which traversal visits the nodes in sorted order?", options: ["Pre-order", "In-order", "Post-order", "Level-order"] },
    { id: 3, text: "What is the time complexity of searching an element in a hash table with perfect hashing?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"] },
    { id: 4, text: "Which data structure is typically used to implement recursion?", options: ["Queue", "Stack", "Linked List", "Tree"] },
    { id: 5, text: "What is the maximum number of edges in a bipartite graph with n vertices?", options: ["n^2 / 4", "n^2 / 2", "n(n-1) / 2", "n - 1"] },
  ];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const terminateExam = useCallback((reason: string = "You violated the strict full-screen policy.") => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setExamTerminated(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    // Notify invigilator via backend API
    const email = localStorage.getItem('auth_email') || '';
    const name = email ? email.split('@')[0] : 'Unknown Student';
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://127.0.0.1:5000' : `${window.location.protocol}//${window.location.hostname}:5000`);
    
    fetch(`${BACKEND_URL}/api/cheat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        message: `Exam Terminated: ${reason}`
      })
    }).catch(err => console.error('Failed to report termination:', err));

    setTimeout(() => {
      try { window.close(); } catch(e) { console.error(e); }
      document.body.innerHTML = `
        <div style="background:#0f172a;color:#ef4444;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:20px"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <h1 style="font-size:3rem;margin:0;font-weight:bold">EXAM TERMINATED</h1>
          <p style="font-size:1.5rem;color:#94a3b8;margin-top:10px">${reason}</p>
          <p style="font-size:1rem;color:#64748b;margin-top:20px">Your camera access has been revoked. Please close this window and contact your invigilator.</p>
        </div>
      `;
    }, 100);
  }, [mediaStream]);

  const handleViolation = useCallback(() => {
    if (violationCooldown.current) return;
    
    setProctorMessage("Warning: Please look at the screen!");
    setWarnings(prev => {
      const newWarnings = prev + 1;
      
      // Notify invigilator via backend API
      const email = localStorage.getItem('auth_email') || '';
      const name = email ? email.split('@')[0] : 'Unknown Student';
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://127.0.0.1:5000' : `${window.location.protocol}//${window.location.hostname}:5000`);
      
      fetch(`${BACKEND_URL}/api/cheat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          message: newWarnings >= 2 ? "Exam terminated by AI: User caught looking away multiple times." : "AI Warning: User looking away from screen."
        })
      }).catch(err => console.error('Failed to report cheating:', err));

      if (newWarnings === 1) {
        alert("WARNING: Please look at the screen and ensure your face is visible. Next violation will terminate your exam.");
        violationCooldown.current = true;
        setTimeout(() => { violationCooldown.current = false; }, 5000); // 5 sec cooldown
      } else if (newWarnings >= 2) {
        terminateExam("You have been caught looking away from the screen multiple times.");
      }
      return newWarnings;
    });
  }, [terminateExam]);

  useEffect(() => {
    if (examStarted && currentQuestion !== prevQuestion.current) {
      if (currentQuestion > 0 && currentQuestion % 2 === 0) {
        // eslint-disable-next-line
        setShow360Toast(true);
        setTimeout(() => setShow360Toast(false), 15000);
      }
      prevQuestion.current = currentQuestion;
    }
  }, [currentQuestion, examStarted]);

  useEffect(() => {
    let reqId: number;

    const detectFace = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        let isUnlocked = false;
        setMaterialsVerified(prev => {
          isUnlocked = prev;
          return prev;
        });

        if (!isUnlocked && objectDetectorRef.current) {
          const objResults = objectDetectorRef.current.detectForVideo(videoRef.current, performance.now());
          // COCO model detects "book" which serves as a proxy for copy/notebook, or "cell phone", etc.
          const foundMaterials = objResults.detections.some(d => 
             d.categories.some(c => c.categoryName === 'book' || c.categoryName === 'bottle' || c.categoryName === 'cup' || c.categoryName === 'cell phone')
          );
          
          if (foundMaterials) {
            setMaterialsVerified(true);
            isUnlocked = true;
            setProctorMessage("Face Verified");
          } else {
            setProctorMessage("Show Pen/Copy to unlock exam");
          }
        }

        if (isUnlocked && landmarkerRef.current) {
          const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
          
          if (results.faceLandmarks && results.faceLandmarks.length > 1) {
            terminateExam("Multiple faces detected in the camera frame. Unauthorized assistance is strictly prohibited.");
            return;
          }

          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            const blendshapes = results.faceBlendshapes[0].categories;
            const eyeLookOutLeft = blendshapes.find(b => b.categoryName === "eyeLookOutLeft")?.score || 0;
            const eyeLookOutRight = blendshapes.find(b => b.categoryName === "eyeLookOutRight")?.score || 0;
            const eyeLookUpLeft = blendshapes.find(b => b.categoryName === "eyeLookUpLeft")?.score || 0;
            const eyeLookDownLeft = blendshapes.find(b => b.categoryName === "eyeLookDownLeft")?.score || 0;
            
            // Increase threshold to avoid false positives, ~0.65 to 0.75 range
            const isLookingAway = eyeLookOutLeft > 0.7 || eyeLookOutRight > 0.7 || eyeLookUpLeft > 0.65 || eyeLookDownLeft > 0.65;
            
            let headTurned = false;
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const nose = landmarks[1];
              const leftEye = landmarks[33];
              const rightEye = landmarks[263];
              
              const leftDist = Math.sqrt(Math.pow(nose.x - leftEye.x, 2) + Math.pow(nose.y - leftEye.y, 2) + Math.pow(nose.z - leftEye.z, 2));
              const rightDist = Math.sqrt(Math.pow(nose.x - rightEye.x, 2) + Math.pow(nose.y - rightEye.y, 2) + Math.pow(nose.z - rightEye.z, 2));
              
              // Ratio greater than 2.5 means head is turned significantly to one side
              if (Math.max(leftDist, rightDist) / Math.min(leftDist, rightDist) > 2.5) {
                headTurned = true;
              }
            }

            if (isLookingAway || headTurned) {
              handleViolation();
            } else {
              if (!violationCooldown.current) {
                setProctorMessage("Face Verified");
              }
            }
          } else {
            // No face detected
            handleViolation();
          }
        }
      }
      
      // Only continue if exam is not terminated
      if (!examTerminated) {
        reqId = requestAnimationFrame(detectFace);
      }
    };

    if (examStarted && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadeddata = () => {
        detectFace();
      };
    }
    return () => {
      if (reqId) cancelAnimationFrame(reqId);
    };
  }, [examStarted, mediaStream, examTerminated, handleViolation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examStarted && !examTerminated) {
        terminateExam();
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [examStarted, mediaStream, examTerminated, terminateExam]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Check if it's a basic greeting or thanks
    const isGreeting = lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('hey');
    const isThanks = lowerQuery.includes('thank');
    
    // Check for website/platform/exams keywords
    const isWebsiteRelated = 
      lowerQuery.includes('samadhan') || 
      lowerQuery.includes('website') || 
      lowerQuery.includes('platform') ||
      lowerQuery.includes('system') ||
      lowerQuery.includes('portal') ||
      lowerQuery.includes('dashboard') ||
      lowerQuery.includes('exam') || 
      lowerQuery.includes('test') || 
      lowerQuery.includes('algorithm') ||
      lowerQuery.includes('syllabus') ||
      lowerQuery.includes('time') ||
      lowerQuery.includes('schedule') ||
      lowerQuery.includes('date') ||
      lowerQuery.includes('calculator') || 
      lowerQuery.includes('carry') || 
      lowerQuery.includes('allow') ||
      lowerQuery.includes('rule') ||
      lowerQuery.includes('device') ||
      lowerQuery.includes('phone') ||
      lowerQuery.includes('watch') ||
      lowerQuery.includes('admit card') || 
      lowerQuery.includes('upload') ||
      lowerQuery.includes('ocr') ||
      lowerQuery.includes('verify') ||
      lowerQuery.includes('verification') ||
      lowerQuery.includes('seat') || 
      lowerQuery.includes('where') ||
      lowerQuery.includes('map') ||
      lowerQuery.includes('navigate') ||
      lowerQuery.includes('navigation') ||
      lowerQuery.includes('room') ||
      lowerQuery.includes('hall') ||
      lowerQuery.includes('block') ||
      lowerQuery.includes('proctor') ||
      lowerQuery.includes('warning') ||
      lowerQuery.includes('cheat') ||
      lowerQuery.includes('camera') ||
      lowerQuery.includes('scan') ||
      lowerQuery.includes('360');

    if (!isWebsiteRelated && !isGreeting && !isThanks) {
      return "I can't understand. I can only assist you with queries related to the SAMADHAN X platform, your exams, seat navigation, rules, or admit card verification.";
    }

    if (lowerQuery.includes('samadhan') || lowerQuery.includes('website') || lowerQuery.includes('platform') || lowerQuery.includes('portal') || lowerQuery.includes('system') || lowerQuery.includes('dashboard')) {
      return "SAMADHAN X is an AI-powered examination ecosystem. It provides secure onboarding, real-time monitoring, and smart features like face verification, 3D seat navigation, and automatic proctoring to make exams fair and seamless.";
    }
    if (lowerQuery.includes('calculator') || lowerQuery.includes('carry') || lowerQuery.includes('allow') || lowerQuery.includes('rule') || lowerQuery.includes('phone') || lowerQuery.includes('watch') || lowerQuery.includes('device')) {
      return "For the Advanced Algorithms exam, only non-programmable scientific calculators and blue/black ballpoint pens are allowed. Smartwatches, mobile phones, bags, and unauthorized materials are strictly prohibited inside the hall.";
    }
    if (lowerQuery.includes('admit card') || lowerQuery.includes('upload') || lowerQuery.includes('ocr') || lowerQuery.includes('verify') || lowerQuery.includes('verification')) {
      return "You can upload your admit card PDF/image in the 'Admit Card Upload' section of this student dashboard. The platform's OCR engine will automatically verify your credentials.";
    }
    if (lowerQuery.includes('seat') || lowerQuery.includes('where') || lowerQuery.includes('map') || lowerQuery.includes('navigate') || lowerQuery.includes('navigation') || lowerQuery.includes('room') || lowerQuery.includes('hall') || lowerQuery.includes('block')) {
      return "Your seat is assigned at Block A, Hall 3, Row 4, Seat 12. Click the 'Open 3D Map' button in the Seat Navigation card to view your seat placement visually.";
    }
    if (lowerQuery.includes('exam') || lowerQuery.includes('test') || lowerQuery.includes('algorithm') || lowerQuery.includes('syllabus') || lowerQuery.includes('time') || lowerQuery.includes('schedule') || lowerQuery.includes('date')) {
      return "Your upcoming exam 'Advanced Algorithms' is scheduled for today at 09:00 AM. The syllabus covers sorting algorithms, binary search trees, hash tables, and dynamic programming.";
    }
    if (lowerQuery.includes('proctor') || lowerQuery.includes('warning') || lowerQuery.includes('cheat') || lowerQuery.includes('camera') || lowerQuery.includes('scan') || lowerQuery.includes('360')) {
      return "The platform features real-time AI Proctoring. You must keep your face visible to the camera, avoid looking away, and show your exam materials (pen & copy) to start. If you look away repeatedly, the exam will be terminated.";
    }
    if (isGreeting) {
      return "Hello John! How can I assist you with your SAMADHAN X platform queries, seat details, or exam guidelines today?";
    }
    if (isThanks) {
      return "You're welcome! Let me know if you have any other questions regarding your exam or the SAMADHAN X platform. Good luck!";
    }

    return "I can't understand. Please ask me about SAMADHAN X features, exam rules, timings, seat placement, or admit card uploads.";
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');

    // Simulate typing delay
    setTimeout(() => {
      const response = generateAIResponse(userMessage);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8 flex justify-between items-start flex-wrap gap-4 relative z-50">
        <div>
          <h1 className="text-3xl font-bold mb-2">{examStarted ? 'Examination in Progress' : 'Student Dashboard'}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {examStarted ? 'Advanced Algorithms - Do not exit full screen mode.' : 'Welcome back. Manage your examination journey here.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 relative">
          {!examStarted ? (
            <button onClick={() => setShowProctoring(true)} className="btn-primary py-2.5 px-6 font-semibold shadow-sm">
              Start Examination Setup
            </button>
          ) : (
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400 rounded-lg font-medium flex items-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                Live Monitored
              </div>
              <button onClick={() => {
                 if (window.confirm("Are you sure you want to submit your exam?")) {
                    setExamTerminated(true);
                    if (window.electronAPI) {
                       window.electronAPI.endExam();
                    }
                    alert("Exam submitted successfully!");
                    window.location.reload();
                 }
              }} className="btn-primary py-2 px-6 font-semibold shadow-sm">
                Submit Exam
              </button>
            </div>
          )}

          {/* Profile Button */}
          <div className="relative ml-2">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-lg">
                {studentName.charAt(0).toUpperCase()}
              </div>
            </button>
            
            <AnimatePresence>
              {showProfile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-14 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate" title={studentName}>{studentName}</h3>
                      <p className="text-xs text-slate-500 truncate" title={studentEmail}>{studentEmail}</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button onClick={() => {
                      localStorage.clear();
                      window.location.href = '/';
                    }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors flex items-center font-medium">
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {examStarted ? (
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Exam Questions Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 min-h-[60vh] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
               </div>
               
               <div className="flex justify-between items-center mb-8 mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">+4 Marks | -1 Negative</span>
               </div>
               
               <h3 className="text-2xl font-semibold mb-8 text-slate-900 dark:text-white leading-relaxed">
                 {questions[currentQuestion].id}. {questions[currentQuestion].text}
               </h3>
               
               <div className={`space-y-4 mb-auto relative ${!materialsVerified ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                 {!materialsVerified && (
                   <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
                     <Lock size={32} className="text-slate-500 mb-2" />
                     <p className="font-semibold text-slate-700 dark:text-slate-200">Exam Locked</p>
                     <p className="text-sm text-slate-500">Please show your pen & copy to the camera to unlock</p>
                   </div>
                 )}
                 {questions[currentQuestion].options.map((option, idx) => {
                   const isSelected = answers[currentQuestion] === option;
                   return (
                     <label 
                       key={idx} 
                       className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                         !materialsVerified ? 'cursor-not-allowed' : 'cursor-pointer'
                       } ${
                         isSelected 
                           ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' 
                           : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                       }`}
                     >
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                         isSelected ? 'border-primary-500' : 'border-slate-300 dark:border-slate-600'
                       }`}>
                         {isSelected && <div className="w-3 h-3 rounded-full bg-primary-500"></div>}
                       </div>
                       <input 
                         type="radio" 
                         name={`question-${currentQuestion}`} 
                         value={option}
                         checked={isSelected}
                         disabled={!materialsVerified}
                         onChange={() => {
                            if (materialsVerified) {
                               setAnswers(prev => ({ ...prev, [currentQuestion]: option }))
                            }
                         }}
                         className="hidden"
                       />
                       <span className={`text-lg ${isSelected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                         {option}
                       </span>
                     </label>
                   );
                 })}
               </div>

               <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-200 dark:border-slate-700">
                 <button 
                   onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                   disabled={currentQuestion === 0}
                   className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                 >
                   Previous
                 </button>
                 <button 
                   onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                   disabled={currentQuestion === questions.length - 1}
                   className="btn-primary px-8 py-3"
                 >
                   Next Question
                 </button>
               </div>
            </div>
          </div>

          {/* Right Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Video Feed */}
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 shadow-sm rounded-xl p-4 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <h3 className="text-md font-semibold mb-3 w-full text-left flex items-center text-slate-900 dark:text-white">
                  <UserCheck size={18} className="mr-2 text-red-500" />
                  Live Proctoring
                </h3>
                <div className="w-full aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden relative border border-slate-200 dark:border-slate-800">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                  <div className={`absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-white flex items-center border border-slate-700/50`}>
                    {proctorMessage === 'Face Verified' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    ) : proctorMessage.includes('unlock') ? (
                      <Lock size={12} className="mr-1.5 text-amber-500 animate-pulse" />
                    ) : (
                      <AlertTriangle size={12} className="mr-1.5 text-amber-500 animate-pulse" />
                    )}
                    {proctorMessage}
                  </div>
                </div>
                <div className="flex flex-col items-center mt-3">
                  <p className="text-xs text-slate-500 text-center">Your camera and screen are being continuously monitored by AI.</p>
                  {warnings > 0 && (
                    <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2 flex items-center bg-amber-500/10 px-2 py-1 rounded">
                      <AlertTriangle size={12} className="mr-1" />
                      Warnings: {warnings}/2
                    </div>
                  )}
                </div>
            </div>

            {/* Timer */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 flex flex-col items-center">
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
                  <Clock size={16} className="mr-2" />
                  <h3 className="font-semibold text-xs uppercase tracking-wider">Time Remaining</h3>
                </div>
                <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white">
                  <span className="text-primary-600 dark:text-primary-400">02</span>:59:59
                </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Question Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, idx) => {
                  let statusClass = "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
                  if (currentQuestion === idx) {
                    statusClass = "bg-primary-600 border-primary-600 text-white z-10 shadow-sm";
                  } else if (answers[idx]) {
                    statusClass = "bg-emerald-500 border-emerald-500 text-white shadow-sm";
                  }
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`w-full aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-colors ${statusClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-emerald-500 mr-2"></div> Answered</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-primary-500 mr-2"></div> Current</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 mr-2"></div> Unanswered</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upload Section */}
          <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="bg-primary-50 dark:bg-primary-900/20 p-2.5 rounded-lg text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30">
                <Upload size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Admit Card Upload</h2>
            </div>
            
            <div className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-8 text-center transition-colors hover:border-primary-500 dark:hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input 
                type="file" 
                id="admit-card" 
                className="hidden" 
                accept="image/*,.pdf"
                onChange={handleUpload}
              />
              <label htmlFor="admit-card" className="cursor-pointer flex flex-col items-center">
                <FileText size={40} className="text-slate-400 dark:text-slate-500 mb-4" />
                <span className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Click to upload or drag & drop</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">PDF, JPG, PNG up to 5MB</span>
              </label>
            </div>

            {ocrStatus === 'processing' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg animate-pulse">
                Processing document via OCR...
              </div>
            )}

            {ocrStatus === 'done' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center">
                    <UserCheck size={18} className="mr-2" />
                    Verification Successful
                  </span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-500">Match: 98.5%</span>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  <p><strong>Name:</strong> John Doe</p>
                  <p><strong>Roll No:</strong> CS-2026-442</p>
                  <p><strong>Exam:</strong> Advanced Algorithms</p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Seat Finder */}
          <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                <MapPin size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Seat Navigation</h2>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl h-64 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 dark:from-indigo-900/10 dark:via-slate-950 dark:to-slate-950"></div>
              <div className="text-center z-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <MapPin size={32} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Block A - Hall 3</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Row 4, Seat 12</p>
                <button onClick={() => setShow3DMap(true)} className="mt-5 btn-secondary text-sm px-6 py-2">Open 3D Map</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Smart Arrival */}
          <div className="bg-primary-600 text-white rounded-xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Clock size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <Clock size={20} />
                <h3 className="font-semibold text-primary-50">Smart Arrival</h3>
              </div>
              <div className="text-3xl font-bold mb-2 tracking-tight">08:45 AM</div>
              <p className="text-primary-100 text-sm mb-6 leading-relaxed">Recommended arrival time based on current traffic and queue length.</p>
              <div className="bg-primary-700/50 border border-primary-500 p-3 rounded-lg text-sm flex justify-between items-center font-medium">
                <span>Traffic: Light</span>
                <span>Queue: 15 mins</span>
              </div>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-md">
                <Bot size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">AI Assistant</h3>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4 text-sm bg-white dark:bg-slate-900">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === 'bot' 
                  ? "bg-white dark:bg-slate-800 p-3 rounded-lg rounded-tl-none border border-slate-200 dark:border-slate-700 max-w-[80%]"
                  : "bg-primary-500 text-white p-3 rounded-lg rounded-tr-none ml-auto max-w-[80%]"
                }>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex space-x-2">
              <input 
                type="text" 
                placeholder="Ask anything..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500" 
              />
              <button type="submit" className="btn-primary px-4 py-1.5 text-sm">Send</button>
            </form>
          </div>
        </div>
      </div>
      )}
      {show3DMap && <SeatMap3D targetRow={4} targetCol={12} onClose={() => setShow3DMap(false)} />}
      {showProctoring && <ProctoringSetup 
        onComplete={(stream) => { 
          setMediaStream(stream);
          setShowProctoring(false); 
          setExamStarted(true);
          sessionStorage.removeItem('show_proctoring');
          sessionStorage.removeItem('proctoring_step');
          if (window.electronAPI) {
            window.electronAPI.startExam();
          }
        }} 
        onClose={() => {
          setShowProctoring(false);
          sessionStorage.removeItem('show_proctoring');
          sessionStorage.removeItem('proctoring_step');
        }}
      />}

      <AnimatePresence>
        {show360Toast && (
          <motion.div 
            initial={{ opacity: 0, x: 50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[400] bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl rounded-2xl p-5 max-w-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                  <Smartphone size={24} className="animate-pulse" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Security Scan Required</h3>
              </div>
              <button onClick={() => setShow360Toast(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
              Please pick up your laptop or camera and perform a slow 360° scan of your room to verify your surroundings. Our AI is recording this.
            </p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShow360Toast(false)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-colors">
                I am scanning now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
