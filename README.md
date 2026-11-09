# 🌆 CivicPulse – Community Complaint Reporting System (SDG 11)

### 👉 [**CLICK HERE TO OPEN THE LIVE WEBSITE**](https://hemashreems-1126.github.io/civicpluse/) 👈

> Cloud Computing ABA · Team 3 · SDG 11 – Sustainable Cities & Communities

---

## ❗ Problem Statement
Citizens report potholes, garbage, broken streetlights and water leaks, but most complaints are **never resolved**. Existing systems have five failures:
1. **No tracking:** complaints vanish and citizens never learn the status.
2. **Fake closures:** officials mark a complaint "Resolved" without actually fixing it.
3. **Duplicates:** many people report the same issue separately, which creates confusion.
4. **No deadlines:** complaints stay pending for months without escalation.
5. **Hard to use:** you need an app, a login and English, and there is no public transparency.

## ✅ Our Solution
| Problem | CivicPulse feature |
|---|---|
| Complaints vanish | **Ticket ID + live status timeline** (Submitted → Assigned → In Progress → Resolved → Closed) |
| Fake closures | **Citizen-verified closure:** only the citizen can close a ticket; "Not fixed" reopens it |
| Duplicates | **Smart duplicate +1:** shows similar issues within 200 m so citizens upvote instead of re-reporting; most-voted issues get priority |
| No deadlines | **SLA auto-escalation:** each category has a deadline, and overdue tickets turn red as "Escalated" |
| Hard to use | **No app, no login:** 3 steps (photo → details → GPS pin), English / ಕನ್ನಡ / हिंदी, mobile-friendly |
| No transparency | **Public live map + dashboard:** charts, top wards, most-voted issues |

## ☁️ Cloud Architecture
```
Citizen / Officer (Browser, mobile or laptop)
        │  HTTPS
        ▼
GitHub Pages  ── static cloud hosting (HTML/CSS/JS)
        │
        ├── Firebase Firestore ── cloud NoSQL database (complaints)   [optional]
        └── OpenStreetMap + Leaflet ── map tiles service
```
- **Hosting:** GitHub Pages (static hosting on a CDN)
- **Database:** Firebase Firestore (Backend-as-a-Service / PaaS). If it isn't configured, the site runs in **demo mode** using browser storage, so the link never breaks.
- **Maps:** Leaflet.js + OpenStreetMap (free, no API key)

## 🧭 How to Use
1. **Report:** add a photo, choose a category, tap "Use my location" (or tap the map), then submit to get a Ticket ID.
2. **Track:** enter the Ticket ID to see the timeline. When it shows "Resolved", choose ✅ *Yes, fixed* or ❌ *Not fixed*.
3. **Admin:** log in with demo PIN **`1234`** to move tickets forward. Tickets are sorted by priority (escalated first, then votes).
4. **Dashboard / Map:** see live statistics. The footer has a **Reset demo data** button.

## 🔌 Connect Firebase (optional, for real cloud storage)
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Go to **Build → Firestore Database → Create** (test mode).
3. Go to **Project settings → Add Web App** and copy the config.
4. Paste the config into `firebase-config.js` (replace `null`) and commit. The footer will show "☁️ Connected to Firebase".

## 🛠 Tech Stack
HTML5 · CSS3 (glassmorphism, animations, responsive) · Vanilla JavaScript · Leaflet · Firebase Firestore · GitHub Pages

## 📁 Files
`index.html` (page) · `style.css` (design) · `app.js` (logic) · `firebase-config.js` (cloud config) · `VIVA.md` (Q&A)
