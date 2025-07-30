
# IEC Nexus - Campus Social Platform

<div align="center">
  <img src="https://placehold.co/128x128/A7C4D3/000000?text=IEC" alt="IEC Nexus Logo" style="border-radius: 50%;" />
  <h1 align="center">IEC Nexus</h1>
  <p align="center">
    An exclusive social platform for the students and faculty of IEC-CET.
    <br />
    <a href="#"><strong>Explore the app »</strong></a>
  </p>
</div>

---

### About The Project

IEC Nexus is a feature-rich social media platform designed exclusively for the students and faculty of the IEC College of Engineering and Technology. It provides a dedicated and secure space for connection, collaboration, and knowledge sharing within the campus community, blending social networking with powerful, modern development tools and AI-driven features.

---

### ✨ Features

-   **Real-time Communication**: Engage in one-on-one direct messaging and dynamic group chats, all updating instantly.
-   **Social & Academic Feed**: Share updates, thoughts, and educational resources. Embed and preview public GitHub repositories directly in posts using StackBlitz.
-   **Robust Group Management**: Create public or private groups, manage members with owner/moderator roles, and post group-specific announcements.
-   **AI-Powered Integrations**:
    -   **Daily Coding Challenge**: Sharpen your skills with a unique, AI-generated programming problem each day with an integrated timer and solution validator.
    -   **AI Resource Suggester**: Get personalized academic resource recommendations based on the latest discussions in your feed.
    -   **AI Profile Customization**: Generate a unique profile banner image based on a text prompt.
-   **Weekly Leaderboard**: Compete with peers by solving daily challenges and earn points to climb the weekly leaderboard.
-   **Advanced User Profiles**: Customizable profiles with banners, avatars, bios, and a view of followers/following.
-   **Push Notifications**: Stay updated with real-time push notifications for messages, follows, and group activity, with customizable settings.
-   **Secure & Role-Based**: Role-based access control for Students and Faculty, with special permissions for faculty members.

---

### 🛠️ How It Works / Tech Stack

This project is built with a modern, serverless-first tech stack designed for scalability and a rich user experience.

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
-   **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas/database)
-   **Generative AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
-   **Real-time & Push Notifications**: [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging)
-   **Image & Media Storage**: [Cloudinary](https://cloudinary.com/)

---

### 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

#### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   A Firebase project
-   A MongoDB Atlas account
-   A Cloudinary account

#### Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables.

    ```env
    # Firebase Project Config (Client-side)
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=
    NEXT_PUBLIC_FIREBASE_VAPID_KEY= # From Firebase Project Settings > Cloud Messaging

    # Firebase Admin SDK (Server-side)
    FIREBASE_CLIENT_EMAIL= # From your service account JSON
    FIREBASE_PRIVATE_KEY=  # From your service account JSON (remember to format it correctly)

    # MongoDB
    MONGODB_URI=

    # Google AI (Genkit)
    GEMINI_API_KEY= # Your Google AI API Key

    # Cloudinary
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    
    # Cron Job Secret
    CRON_SECRET= # A random, secure string for protecting the leaderboard reset endpoint
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

---

### ✅ To-Do

Here are some features and improvements planned for the future:

-   [ ] Full-text search for posts and comments.
-   [ ] Video call integration within groups or direct messages.
-   [ ] A dedicated events calendar for campus activities.
-   [ ] Light/Dark mode toggle for user preference.
-   [ ] End-to-end tests for critical user flows.

