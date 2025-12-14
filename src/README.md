# 📚 Instil Learning Hub (React Native / Firebase)

This project is a React Native mobile client for the Instil Learning Hub, a student/faculty chat and administrative platform. It uses Firebase for real-time data, authentication, and file storage.

## ✨ Features Implemented

* **Role-Based Dashboards:** Separate views for Students, Faculty, and Admins.
* **Real-time Chat:** Supports Doubt chats, Group chats (Paper chats), Direct Messages (DM), and Support chats.
* **Media Handling:** Supports uploading and viewing images, audio recordings, and generic files/videos.
* **Doubt Submission:** Dedicated flow for students to submit doubts with screenshot attachments.
* **FAQ/Topics:** Group chat topics sidebar and staff ability to save messages as persistent FAQs.
* **Administrative Tools:** User creation, paper/team management, and performance tracking (SLA timers/ratings).
* **Real-time Presence:** Tracks user online/offline status using Firebase Realtime Database.
* **Rating System:** Modal for students to rate faculty upon doubt resolution.

## 🚀 Setup & Installation

### Prerequisites

1.  Node.js (LTS version)
2.  Expo CLI (`npm install -g expo-cli`)
3.  A Firebase Project configured with:
    * **Authentication:** Email/Password enabled.
    * **Firestore:** Database created (ensure security rules allow read/write for testing).
    * **Realtime Database (RTDB):** Enabled (used for presence tracking).
    * **Storage:** Enabled (used for media uploads).

### Project Steps

1.  **Clone the Repository:**
    ```bash
    git clone [repository-url]
    cd instil-learning-hub
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Firebase:**
    * Create `src/firebase/config.js` and paste your web application configuration keys.

4.  **Run the Application:**
    ```bash
    expo start
    ```
    Scan the QR code with the Expo Go app on your mobile device.

## 🔑 Key Roles for Testing

| Role | Dashboard | Permissions |
| :--- | :--- | :--- |
| **student** | StudentDashboard | Submit Doubts, Group Chats, DMs. |
| **faculty** | FacultyDashboard | Resolve Doubts, SLA tracking, Group Chats, Save FAQs. |
| **admin** | AdminDashboard | User/Paper/Team Management, Performance Tracking. |

---
**END OF PROJECT**