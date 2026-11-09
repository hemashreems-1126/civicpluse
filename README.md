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
        ├── Firebase Firestore ── cloud NoSQL database (complaints)   ✅ connected
        └── OpenStreetMap + Leaflet ── map tiles service
```
- **Hosting:** GitHub Pages (static hosting on a CDN)
- **Database:** Firebase Firestore (Backend-as-a-Service), project `civicpulse-efa84`. If it can't be reached, the site falls back to **demo mode** using browser storage, so the link never breaks.
- **Maps:** Leaflet.js + OpenStreetMap (free, no API key)

## 🧭 How to Use
1. **Report:** add a photo, choose a category, tap "Use my location" (or tap the map), then submit to get a Ticket ID.
2. **Track:** enter the Ticket ID to see the timeline. When it shows "Resolved", choose ✅ *Yes, fixed* or ❌ *Not fixed*.
3. **Admin:** log in with demo PIN **`1234`** to move tickets forward. Tickets are sorted by priority (escalated first, then votes).
4. **Dashboard / Map:** see live statistics. The footer has a **Reset demo data** button.

## 🔌 Firebase (cloud database) – ✅ Connected
CivicPulse stores every complaint in **Firebase Cloud Firestore**.

| Setting | Value |
|---|---|
| Project ID | `civicpulse-efa84` |
| Database | Cloud Firestore (Standard), test mode |
| Collection | `complaints` (one document per ticket, e.g. `CP-1001`) |
| Plan | Spark (free) |
| Config file | `firebase-config.js` |

The website footer shows **"☁️ Connected to Firebase Firestore"** when the cloud is active.
If Firebase can't be reached, the app automatically falls back to **demo mode** (browser storage), so it never breaks.

**How it was set up:**
1. Firebase Console → **Create project** (`civicpulse`, Analytics off).
2. **Databases & Storage → Firestore Database → Create database** → Mumbai (asia-south1) → **test mode**.
3. **Project Overview → Add app → Web `</>`** → copied `firebaseConfig`.
4. Pasted it into `firebase-config.js` and committed. GitHub Pages redeployed automatically.

> Test mode allows reads/writes for 30 days. For long-term use, update the Firestore security rules.

## 🛠 Tech Stack
HTML5 · CSS3 (glassmorphism, animations, responsive) · Vanilla JavaScript · Leaflet · Firebase Firestore · GitHub Pages

## 📁 Files
`index.html` (page) · `style.css` (design) · `app.js` (logic) · `firebase-config.js` (cloud config) · `VIVA.md` (Q&A)
