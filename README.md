# Nuz AI App Workspace

This is a unified repository for the Nuz AI ecosystem.

## Project Structure
- `/android`: Native Android application (Jetpack Compose).
- `/backend`: Node.js Express server handling AI core logic.
- `/frontend`: React + Vite web dashboard.

## How to Run

### 1. Backend Server
1. Navigate to `/backend`.
2. Ensure `.env` contains your `GEMINI_API_KEY` and `CLAUDE_API_KEY`.
3. Run `npm install`.
4. Run `npm start`.
   * (Alternatively, use the "Backend Server" run configuration in IntelliJ/Android Studio).

### 2. Frontend (Web)
1. Navigate to `/frontend`.
2. Run `npm install`.
3. Run `npm run dev`.
   * (Alternatively, use the "Frontend Dev" run configuration).

### 3. Android App
1. Open the `/android` folder in **Android Studio**.
2. Wait for Gradle sync to complete.
3. Select your device and click **Run**.
   * The app is configured to load the production URL by default.
   * To test against a local backend, update `BASE_URL` in `android/app/build.gradle.kts` to `http://10.0.2.2:8080` (for emulator).

## Deployment
Use the included `Dockerfile` to deploy the unified Web stack (Frontend + Backend) to Google Cloud Run.
