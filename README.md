# RoadWatch AI
## AI-Assisted Predictive Road Safety Monitoring System

### Road Safety Hackathon 2026 – IIT Madras CoERS

## Overview
RoadWatch AI is an AI-powered road safety monitoring platform designed to detect road damage, assess accident risks, and assist authorities in prioritizing maintenance activities. The system leverages Computer Vision, Artificial Intelligence, and Smart Governance tools to improve road safety and reduce accidents caused by poor road conditions.

---

## Problem Statement
Road accidents caused by potholes, cracks, and poor road maintenance remain a major challenge. Traditional road inspection methods are slow, expensive, and lack real-time monitoring capabilities.

### Key Challenges
- Delayed reporting of road damage
- Lack of real-time monitoring
- Inefficient maintenance prioritization
- Increased accident risk due to unsafe roads

---

## Solution
RoadWatch AI enables citizens to report damaged roads through a mobile-friendly interface. AI models analyze uploaded images, determine damage severity, calculate accident risk, and provide actionable insights through a governance dashboard.

### Workflow
1. Citizen uploads road image and location.
2. Firebase stores report data.
3. YOLOv8 + OpenCV detect road damage.
4. Risk Analysis Engine calculates severity and priority.
5. Dashboard alerts authorities for action.

---

## Technology Stack

### Frontend
- React.js
- Tailwind CSS

### Backend
- Firebase Authentication
- Firestore Database
- Firebase Storage

### AI & Computer Vision
- YOLOv8
- OpenCV
- Gemini API

### Mapping & Visualization
- OpenStreetMap
- Leaflet.js

---

## Key Features
- AI-based pothole and crack detection
- Road Health Score
- Predictive Accident Risk Analysis
- Real-time reporting and monitoring
- Geo-tagged damage reports
- Smart Governance Dashboard
- AI-generated municipal reports
- Community verification system

---

## System Architecture

Citizen Mobile App
→ Firebase Cloud
→ AI Detection Engine (YOLOv8 + OpenCV)
→ Risk Analysis Engine
→ Smart Dashboard

---

## Impact
- Faster road maintenance decisions
- Reduced accident risks
- Improved public safety
- Data-driven governance
- Smart city integration

---

## Scalability
RoadWatch AI is designed to scale from:
- Municipal Level
- City Level
- State Level
- National Level

Future integrations may include:
- Drone-based inspections
- CCTV monitoring
- Emergency response systems
- Smart city infrastructure platforms

---

## Team

### Team Name
SafeRoute Nexus

### Team Members
- Prince Rana (Team Lead)
- Rudra Chauhan
- Saloni Bhati
- Sarika Saini

### College
Parul University, Gujarat

---

## Tagline
**"Building Safer Roads with AI-Driven Intelligence."**
