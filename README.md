# 🛣️ RoadWatch AI

**A road safety platform that detects hazards, tracks repairs, and helps authorities respond faster.**

> Built for the Road Safety Hackathon 2026 — IIT Madras CoERS  
> Team: SafeRoute Nexus · Parul University, Gujarat

---

## The Problem

Bad roads are more common than they should be. Potholes, cracks, and waterlogged surfaces cause thousands of accidents every year — and the frustrating part is that most of them go unreported for weeks.

The current process is slow. Someone notices a pothole. Maybe they call a helpline. The complaint gets logged somewhere. A team eventually visits. By the time repairs happen, more damage has accumulated and another accident might have occurred.

There's no visibility into what's happening — not for citizens, not for municipal officers, and not for repair teams. Everyone's working in the dark.

---

## Why We Built This

We started thinking about this problem when we noticed that the road near one of our college gates had a large pothole for over two months. Nobody fixed it. Not because nobody cared — but because there was no system to flag it, track it, or assign responsibility.

That's what led us to build RoadWatch AI. We wanted something that closes the gap between "someone noticed a problem" and "the problem got fixed," with full visibility at every step.

---

## What RoadWatch AI Does

RoadWatch AI is a web platform that connects citizens, AI detection, and municipal response into a single workflow.

Citizens can report road hazards with a photo. The platform uses AI to validate the damage, scores it by severity, and plots it on a live map. Authorities can then assign repair teams, track progress, and close out issues once they're resolved. Citizens can verify the fix and leave feedback.

The whole cycle — from report to resolution — happens inside one platform.

---

## Key Features

### 🔍 AI Hazard Detection
Upload an image of a damaged road and the platform analyses it to identify the type and severity of damage. You can upload images through the portal or submit a report from the citizen-facing interface.

### 🗺️ Live Hazard Map
All active hazards are shown on an interactive heatmap. You can zoom in, click a pin to see details, and filter by severity or location. The map updates in real time as new reports come in.

### 📋 Citizen Reporting
A straightforward form lets anyone submit a road issue — photo, location, and description. Reports go into the system immediately and are visible to authorities.

### ✅ Repair Tracking Workflow
Each report moves through a defined workflow: Detected → Verified → Assigned → Repairing → Resolved. Every stage is tracked with timestamps, assigned teams, and progress notes. Authorities can manage all of this from a KanBan-style panel on the dashboard.

### 🎯 Priority Scoring
Not all road damage is equally urgent. Each report gets a priority score (out of 100) based on severity, estimated risk, and recommended repair window. This helps authorities decide where to act first.

### 📈 Road Risk Prediction
The platform includes a section that analyses existing hazard data to estimate which zones are at higher risk of deterioration. It's not a live sensor system — it works from the existing report history and flags areas that need attention before things get worse.

### 🤖 AI Assistant
A built-in assistant answers questions about road safety conditions, active hazards, and dashboard data. It's useful for quick lookups during a demonstration or when someone wants a summary without digging through the data.

### 📊 Analytics & Reports
The analytics section gives an overview of detection trends, resolution times, severity distribution, and citizen satisfaction. There's also a report generation feature that summarises findings in a structured format.

### 🔔 Real-Time Dashboard
The main dashboard shows active hazards, key safety metrics, resolution counts, and a live feed of incoming reports. Everything updates automatically.

---

## How It Works

Here's the basic flow from a report being submitted to it getting resolved:

```
1. Citizen submits report (photo + location)
        ↓
2. AI validates the image and classifies damage type
        ↓
3. Hazard appears on the live map with a severity badge
        ↓
4. AI generates a priority score (0–100)
        ↓
5. Authority reviews → assigns repair team
        ↓
6. Repair team is dispatched → status updates to "Repairing"
        ↓
7. Repair is completed → before/after images logged
        ↓
8. Citizen verifies the fix → rates quality (1–5 stars)
        ↓
9. Dashboard metrics update (safety score, resolution time, etc.)
```

We built a 9-stage demo simulation into the platform that walks through this entire workflow automatically — useful for demonstrations and judging.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (TypeScript), Vite |
| Styling | Vanilla CSS with custom design tokens |
| AI Detection | Gemini API (image analysis) |
| Backend & Auth | Firebase (Firestore, Authentication, Storage) |
| State & Storage | localStorage + custom event bus |
| Maps | Flat city grid map with coordinate overlays |
| Routing | React Router v6 |

We chose Firebase because it gave us real-time sync out of the box without needing to set up a separate server. The frontend is entirely React with TypeScript, which made it easier to keep the data models consistent across components.

---

## System Workflow

```
┌─────────────────┐      ┌────────────────────── ┐      ┌──────────────────────┐
│  Citizen Portal │ ───► │  AI Analysis Engine   │ ───► │  Operations Dashboard│
│                 │      │                       │      │                      │
│ - Submit report │      │ - Image classification│      │ - Live hazard feed   │
│ - Upload photo  │      │ - Severity scoring    │      │ - KanBan repair panel│
│ - Track status  │      │ - Priority ranking    │      │ - Before/After view  │
│ - Verify repair │      │ - Risk prediction     │      │ - Analytics & reports│
└─────────────────┘      └──────────────────────┘       └──────────────────────┘
          ▲                                                       ▲
          └──────────────── Status Updates & Feedback ────────────┘
```

---

## What Makes RoadWatch AI Different?

Most road reporting tools stop at the reporting step — you submit something, and then you have no idea what happens next. On the other side, municipal dashboards often exist as internal tools with no citizen-facing component.

RoadWatch AI tries to bridge both sides:

- **Citizens can report** and then actually track what happens to their report
- **Authorities have a structured workflow** with priority scoring so they're not just reacting to complaints
- **AI validates and classifies** the damage so the data going into the system is cleaner
- **Before/after comparison** creates accountability — there's visual proof of what was repaired
- **Citizen verification** closes the loop — the person who reported the issue can confirm it's actually fixed and rate the quality of work

It's not just a detection tool or just a reporting app. The whole point is that these things work together in one place.

---

## Impact

We're not claiming specific numbers because we built this for a hackathon and haven't deployed it at scale. But the problems it addresses are real and measurable:

- Road accidents caused by poor surfaces cost lives and money every year
- Most municipalities lack structured workflows for hazard-to-resolution tracking
- Citizens rarely know what happens to a complaint they've filed
- Repair prioritisation is often manual and inconsistent

If something like this were deployed at even a district level, the biggest wins would likely be: faster response to critical hazards, better accountability for repair teams, and a cleaner data trail for infrastructure planning.

---

## Challenges We Faced

**Getting the repair workflow right** — We went through several iterations of the status workflow. The challenge was making it simple enough to use during a demo but realistic enough to reflect how repairs actually work.

**Keeping the scope manageable** — We had a lot of ideas initially (IoT sensors, drone integration, government budget tracking). We had to be honest with ourselves about what we could actually build and demonstrate well in the time we had.

**Making the AI image analysis feel real** — Since we're using Gemini API for image analysis, the actual detection depends on what the model returns. Getting that to integrate cleanly with the rest of the workflow took more time than expected.

**State management without a backend** — We built the frontend to work with localStorage and a custom event bus rather than a full backend. This made offline demos reliable but meant we had to be careful about data consistency across components.

---

## Future Improvements

Things we'd want to add if we continued working on this:

- **Mobile app** — The citizen reporting part makes more sense as a native app with camera access and GPS
- **Real model integration** — Replace the demo simulation with an actual trained model for pothole detection
- **Offline-first PWA** — So citizens in areas with poor connectivity can still submit reports
- **SMS notifications** — For citizens who don't use smartphones regularly
- **Historical trend analysis** — Using past repair data to predict which roads will need attention soonest
- **Multi-language support** — Road safety is a problem across India, not just in English-speaking areas

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/RANAPRINCE06/ROADWATCH-AI.git
cd ROADWATCH-AI

# Install dependencies
npm install

# Add environment variables
cp .env.example .env
# Fill in your Firebase and Gemini API keys in .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Demo Mode**: Click the "Demo Mode" button in the top bar to run through the full 9-stage repair workflow simulation automatically.

---

## Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
```

---

## Team

**SafeRoute Nexus** · Parul University, Gujarat

| Name           | Role                        |
|----------------|-----------------------------|
| Prince Rana    | Team Lead, Frontend & Integration |
| Rudra Chauhan  | AI Integration & Backend    |
| Saloni Bhati   | UI Design & Citizen Portal  |
| Sarika Saini   | Analytics & Reporting       |

---

## License

MIT License — feel free to use, modify, or build on this.

---

*We built RoadWatch AI because road safety is something that affects everyone, and we wanted to see if technology could make the process of fixing bad roads even a little bit faster and more accountable. There's a lot more that could be done — this is a starting point.*
