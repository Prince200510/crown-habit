# 👑 CROWN HABIT — Reset. Track. Improve.

**CROWN HABIT** is an Android-first personal discipline, daily routine, AI nutrition, and live step/calorie deficit tracker built with **React 18**, **Vite**, **Tailwind CSS**, **Capacitor 6 (Android)**, **Firebase Authentication & Cloud Firestore**, and **Google Gemini Vision AI (`gemini-2.5-flash`)**.

- **Author:** Prince Maurya ([princemaurya8879@gmail.com](mailto:princemaurya8879@gmail.com))
- **GitHub Repository:** [https://github.com/Prince200510/crown-habit](https://github.com/Prince200510/crown-habit)

---

## ✨ Key Features

### 1. 🤖 Crown AI Food Scanner (Indian & Global Cuisine)
- Snap or upload a meal photo and analyze it using **Google Gemini 2.5 Flash**.
- Automatically identifies Indian and global dishes (e.g., *South Indian Thali*, *Roti/Chapati*, *Dal*, *Sambar*, *Paneer*, *Biryani*, *Oats*) with estimated portion sizes (`katori`, `piece`, `bowl`, `grams`).
- Calculates **Calories (`kcal`)**, **Protein (`g`)**, **Carbs (`g`)**, **Fat (`g`)**, and **Fibre (`g`)**.
- **Smart Thali Grouping**: Multi-item meals are grouped into a single meal entry with an expandable **`Details (X items)`** breakdown across the Dashboard, Food Diary, and History Archive.

### 2. 👟 Automatic Walk & Calorie Deficit Sensor
- **Native Android Hardware Pedometer (`StepCounterPlugin.java`)**: Hooks directly into Android's `Sensor.TYPE_STEP_COUNTER` and `Sensor.TYPE_STEP_DETECTOR` with `SharedPreferences` daily baseline persistence—automatically counting steps in both **foreground and background** without needing a manual "Start Walk" button.
- **3-Axis Accelerometer Fallback**: Uses `DeviceMotionEvent` magnitude peak detection on supported mobile web browsers.
- **Live Calorie Burn & Net Deficit**: Calculates real-time **Steps Today**, **Distance (`km`)**, **Active Walk Time**, **Walk Calories Burned (`-kcal`)** scaled to your **Body Weight (`kg`)**, and **Net Calorie Balance (`Food Calories - Walk Burned`)**.
- **Auto-Habit Completion**: Automatically marks your daily *Evening walk* habit as **Completed** once you hit your daily step or active duration target.

### 3. ⏰ Daily Routine Engine with Auto-Macro Logging & Reminders
- Create, reorder, pause, or customize daily habits across categories (*Hydration*, *Nutrition*, *Fitness*, *Sleep*, *Mindfulness*, *Productivity*).
- **Auto-Nutrition Logging on Completion**: Attach **Calories (`kcal`)**, **Protein (`g`)**, **Carbs (`g`)**, and **Fat (`g`)** to any routine task (e.g., *Morning oats*, *Healthy lunch*, *Protein Shake*). Marking the habit **Done** automatically logs its macros into your daily nutrition totals.
- **Local Notifications (`@capacitor/local-notifications`)**: Schedules exact daily habit reminders plus automatic `+15 min` follow-up reminders if a task remains incomplete.
- **Automatic Midnight Reset**: Preserves yesterday's completed checklist in the History Archive and initializes a fresh checklist at `00:00` (`Asia/Kolkata`).

### 4. 🔥 History Calendar & Daily Fire Streak
- Interactive monthly calendar archive showing your historical habit completion, meals, steps, and calorie balance for any date.
- **Daily Fire Streak (`🔥`)**: Every date where you complete **100% of scheduled habits** AND stay **under your net calorie deficit target** earns a **Fire (`🔥`)** badge on the calendar, tracking your **Current Fire Streak**, **Best Streak**, and **Monthly Fire Days**.

### 5. ☁️ Real-Time Cross-Device Cloud Sync (Offline-First)
- **30-Day Persistent Authentication**: Sign in once with Firebase Email/Password and stay signed in for 30 days.
- **Instant Live Sync (`onSnapshot`)**: Changes made on your Android phone (marking habits Done, logging meals, or walking) reflect live on your laptop browser in real time.
- **Offline Queue**: Works 100% offline using `localStorage` and `@capacitor/preferences`, automatically flushing queued changes when connectivity returns.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Lucide React |
| **Mobile Runtime** | Capacitor 6 (`@capacitor/android`, `@capacitor/camera`, `@capacitor/local-notifications`, `@capacitor/preferences`) |
| **Native Android** | Java 21, Android SensorManager (`TYPE_STEP_COUNTER`, `TYPE_STEP_DETECTOR`) |
| **Cloud & Auth** | Firebase Authentication, Cloud Firestore (Real-time `onSnapshot` + Offline Queue) |
| **AI Vision Engine** | Google Gemini API (`gemini-2.5-flash`) |

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/Prince200510/crown-habit.git
cd crown-habit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (`.env`)
Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Run on Localhost
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📱 Building the Standalone Android APK

The Vite build automatically bundles your configuration so the Android APK runs as a standalone app on your phone without requiring a separate server.

```bash
# 1. Build the production web bundle
npm run build

# 2. Sync web assets and native plugins to the Android project
npx cap sync android

# 3. Open the Android project in Android Studio
npx cap open android
```

Inside **Android Studio**:
1. Wait for Gradle Sync to finish (configured for Android Studio's bundled JDK 21 in `android/gradle.properties`).
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Install `android/app/build/outputs/apk/debug/app-debug.apk` on your Android phone.

---

## 📂 Project Structure

```text
crown-habit/
├── android/                                  # Native Capacitor Android project & StepCounterPlugin.java
├── api/
│   └── analyze-meal.js                       # Serverless Gemini API handler (Vercel compatible)
├── server/
│   └── gemini-proxy.js                       # Optional local Express proxy for Gemini Vision
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                        # Desktop sidebar, mobile drawer & 4-tab bottom bar
│   │   └── QuickFoodModal.jsx                # Manual & outside food entry modal
│   ├── context/
│   │   └── AppContext.jsx                    # State engine, real-time Firestore sync & auto-macro logger
│   ├── pages/
│   │   ├── Auth/LoginPage.jsx                # 30-day persistent Sign In / Create Account screen
│   │   ├── Dashboard/Dashboard.jsx           # Daily command center & live walk/calorie deficit sensor
│   │   ├── Routine/Routine.jsx               # Habit CRUD, inline macro editor & reminder scheduling
│   │   ├── FoodScanner/FoodScanner.jsx       # Gemini AI camera/gallery scanner & Thali grouping
│   │   ├── FoodDiary/FoodDiary.jsx           # Meal-wise nutrition log & macro breakdown
│   │   ├── History/History.jsx               # Monthly archive calendar & Daily Fire Streak tracker
│   │   ├── Reports/Reports.jsx               # 7-day & 30-day nutrition and consistency analytics
│   │   └── Settings/Settings.jsx             # Goals, body weight, reminders, JSON export & cloud sync
│   ├── services/
│   │   ├── firebase/                         # Firebase initialization & Cloud Firestore CRUD/subscriptions
│   │   ├── gemini/                           # On-device & proxy Gemini Vision service + image compression
│   │   ├── localStorage/                     # Offline-first storage & Capacitor Preferences sync
│   │   ├── notifications/                    # Android local notification & follow-up scheduler
│   │   └── nutrition/                        # Macro calculator, Thali grouper & step tracker engine
│   └── utils/
│       └── dateUtils.js                      # Timezone-aware (Asia/Kolkata) date & streak utilities
├── capacitor.config.json
├── firestore.rules
├── package.json
└── vite.config.js
```

---

## 👤 Author & Contact

**Prince Maurya**
- 📧 Email: [princemaurya8879@gmail.com](mailto:princemaurya8879@gmail.com)
- 💻 GitHub: [@Prince200510](https://github.com/Prince200510)
- 🔗 Repository: [https://github.com/Prince200510/crown-habit](https://github.com/Prince200510/crown-habit)
