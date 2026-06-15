# SAMADHAN X — Secure & Intelligent Examination Platform

> A next-generation, AI-powered online examination ecosystem built for fairness, security, and real-time oversight. Built for a Hackathon.

---

## Overview

**SAMADHAN X** is a full-stack examination platform that combines a React web application, a Node.js/Socket.IO backend, and a custom Electron-based secure browser to deliver a tamper-resistant, AI-proctored exam experience.

The platform serves three roles — **Students**, **Invigilators**, and **Admins** — each with a dedicated dashboard and access controls enforced via Firebase Authentication and Firestore.

---

## Architecture

```
zup_examination/
├── Project/
│   ├── Website/
│   │   ├── frontend/        # React + TypeScript + Vite web app
│   │   └── backend/         # Express + Socket.IO API server
│   └── browser/             # Electron secure exam browser
```

The three components work together:

- The **frontend** hosts the student exam interface, invigilator dashboard, and admin panel.
- The **backend** manages student records and broadcasts real-time events (seat assignments, cheating alerts) via Socket.IO.
- The **Electron browser** locks a student's desktop into kiosk mode during the exam and reports violations to the backend.

---

## Features

### AI-Powered Proctoring
- **Face Recognition** — Uses `face-api.js` (TinyFaceDetector + FaceRecognitionNet) to verify student identity before the exam begins by comparing against a reference face captured by the invigilator.
- **Live Face Detection** — Continuous face tracking during the exam via MediaPipe Tasks Vision.
- **360° Environment Scan** — Students are required to pan their webcam around the room before starting.

### Cheating Detection & Alerts
- **Tab Switch / Window Blur Detection** — Any attempt to leave the exam tab is flagged and a real-time alert is sent to the invigilator.
- **Alt+Tab, Copy/Paste, Escape Blocking** — Globally intercepted via Electron's `globalShortcut` API during exam lockdown.
- **Multi-Monitor Detection** — Uses the Window Placement API to block students with external displays connected.
- **Identity Mismatch Alerts** — If face verification fails, an incident is immediately posted to the backend.

### Secure Browser (Electron)
- Kiosk mode lockdown (`setKiosk(true)`) prevents window resizing, task switching, and closing.
- Always-on-top enforcement to prevent other applications from overlaying the exam.
- Automatic camera/microphone permission granting for seamless proctoring setup.
- Visual toolbar changes to red during exam lockdown as a clear indicator.

### Real-Time Invigilator Dashboard
- Live seat map with 3D visualization (Three.js).
- Student attendance and status updates pushed via Socket.IO.
- Instant cheating attempt alerts with student name, roll number, and violation description.
- Camera capture modal to register student reference faces for identity verification.

### Role-Based Access Control
- **Student** — Access to their exam dashboard, proctoring setup, and exam interface.
- **Invigilator** — Monitor students, manage seat assignments, view live alerts.
- **Admin** — Full platform administration.
- Authentication via Firebase Auth; roles stored in Firestore.

### UI/UX
- Dark/Light theme toggle.
- Smooth animations via Framer Motion.
- Fully responsive layout built with Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| 3D Visualization | Three.js |
| AI / Face Detection | face-api.js, MediaPipe Tasks Vision |
| Auth & Database | Firebase Auth, Firestore |
| Backend | Node.js, Express 5, Socket.IO |
| Secure Browser | Electron, electron-builder |
| Real-time | Socket.IO (WebSockets) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Authentication** (Email/Password) and **Firestore** enabled.

---

### 1. Backend Setup

```bash
cd Project/Website/backend
npm install
```

Create a `.env` file (see `.env.example`):

```env
PORT=5000
```

Start the server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The backend runs on `http://localhost:5000` by default.

---

### 2. Frontend Setup

```bash
cd Project/Website/frontend
npm install
```

Create a `.env` file (see `.env.example`) and fill in your Firebase project credentials:

```env
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
VITE_BACKEND_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

### 3. Secure Browser Setup (Electron)

```bash
cd Project/browser
npm install
```

Run in development:

```bash
npm start
```

Build a distributable (Windows):

```bash
npm run dist
```

This produces an NSIS installer and a portable `.exe` in the `dist/` folder.

> **Note:** The Electron browser connects to the backend at `http://127.0.0.1:3000`. Update the URL in `main.js` if your backend runs on a different port.

---

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Email/Password** sign-in under Authentication.
3. Create a **Firestore** database. For each user, create a document at `users/{uid}` with a `role` field set to `"student"`, `"invigilator"`, or `"admin"`.
4. Copy your Firebase config values into the frontend `.env` file.

---

## Environment Variables Reference

### Backend (`Project/Website/backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express server |

### Frontend (`Project/Website/frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_KEY` | Firebase API key |
| `VITE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_PROJECT_ID` | Firebase project ID |
| `VITE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_APP_ID` | Firebase app ID |
| `VITE_BACKEND_URL` | URL of the Express backend |

---
## Demo Ids
Student Login : 
Mail :- shubh@gmail.com & Password :- 12345678 
Invigilator : 
Mail :- harsh@gmail.com & Password :- 12345678 

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | Get all registered students |
| `POST` | `/api/students` | Register a new student `{ name, roll, seat }` |
| `PUT` | `/api/students/:id/status` | Update student status `{ status }` |
| `PUT` | `/api/students/:id` | Update any student fields |
| `POST` | `/api/cheat` | Report a cheating event `{ name, message }` |

### Socket.IO Events

| Event | Direction | Payload |
|---|---|---|
| `student_added` | Server → Client | New student object |
| `student_updated` | Server → Client | Updated student object |
| `cheating_attempt` | Server → Client | `{ id, roll, name, message, timestamp }` |

---

## Project Structure (Frontend)

```
src/
├── components/
│   ├── CameraCaptureModal.tsx   # Invigilator face capture
│   ├── Card.tsx                 # Reusable card component
│   ├── ProctoringSetup.tsx      # 4-step proctoring wizard
│   └── SeatMap3D.tsx            # Three.js seat visualization
├── config/
│   └── firebase.ts              # Firebase initialization
├── contexts/
│   ├── AuthContext.tsx          # Auth state & role management
│   └── ThemeContext.tsx         # Dark/light theme
├── pages/
│   ├── AdminDashboard.tsx
│   ├── InvigilatorDashboard.tsx
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   └── StudentDashboard.tsx
└── layouts/
    └── Layout.tsx
```

---

## License

This project was built as a Hackathon submission. All rights reserved by the respective authors.
