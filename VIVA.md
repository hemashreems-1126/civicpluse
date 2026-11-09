# 🎤 Viva Q&A – CivicPulse

**1. What is your project?**
A cloud-hosted website where citizens report civic issues like potholes and garbage, track them with a Ticket ID, and confirm when they're fixed. It supports SDG 11 (Sustainable Cities).

**2. What problem are you solving that existing apps don't?**
Existing apps let officials close complaints without fixing them, and citizens never see the status. We added **citizen-verified closure**, **public tracking**, **duplicate +1 voting** and **SLA escalation**.

**3. Where is the cloud computing in this?**
The site is hosted on **GitHub Pages** (cloud static hosting on a CDN). The data is stored in **Firebase Firestore**, a cloud NoSQL database. The maps come from the **OpenStreetMap** tile service. We don't run or manage any server ourselves.

**4. Which cloud service models are used?**
- GitHub Pages: **PaaS** (hosting platform)
- Firebase: **BaaS/PaaS** (managed database)
- The citizen uses the website as **SaaS**

**5. Which deployment model?** A **public cloud**.

**6. Why Firebase and not MySQL?**
Firebase is serverless, so there's no server to maintain. It scales automatically, has a free tier, offers real-time sync and works directly from the browser.

**7. What is SLA?**
SLA stands for Service Level Agreement, which here means a promised time to fix a problem. For example, garbage must be cleared in 2 days and a pothole fixed in 5. If the deadline passes, the ticket is automatically marked **Escalated**.

**8. How do you detect duplicates?**
When a user picks a category and location, we compute the distance to existing open complaints of the same category using the **Haversine formula**. If one is within 200 m, we show it and offer "+1 Me too".

**9. How do you prevent fake closures?**
An officer can only mark a ticket **Resolved**. Only the citizen can mark it **Closed**. If the citizen says "Not fixed", the ticket goes back to In Progress and the reopen count increases.

**10. How do you prioritise complaints?**
Escalated tickets come first, then tickets sorted by the number of citizen votes.

**11. What happens if the internet or Firebase fails?**
The site falls back to **demo mode** and saves data in the browser (localStorage), so it never crashes.

**12. Is it mobile friendly?**
Yes. It uses a responsive CSS grid and media queries, has a hamburger menu, uses phone GPS for location and compresses photos before upload.

**13. Security?**
The site is served over HTTPS by GitHub Pages and user input is escaped to prevent XSS. Firestore security rules can restrict writes. The admin PIN is for demo only; a real version would use Firebase Authentication.

**14. Scalability?**
GitHub Pages serves the site from a global CDN, and Firestore scales automatically to millions of documents.

**15. Future scope?**
Firebase Auth with OTP, SMS/WhatsApp notifications, AI photo classification and integration with municipal (BBMP/MCC) systems.

**16. Each member's role (example)**
- Member 1: UI/UX and CSS
- Member 2: JavaScript logic (tracking, SLA, duplicates)
- Member 3: Cloud (Firebase, GitHub Pages deployment) and documentation
