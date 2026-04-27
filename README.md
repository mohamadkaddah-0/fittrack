# FitTrack — Fitness Tracking Web Application

## Project Overview

FitTrack is a full-stack fitness tracking application built with React, Vite, and Tailwind CSS on the frontend and an Express.js REST API backed by a MySQL database on the backend. The platform allows users to register, complete a personalised fitness survey, track their diet, log workouts, monitor nutritional progress, sync steps via Google Fit, and receive personalised meal recommendations based on their fitness profile.

**Team Members — Deployables**
- Sara Ibrahim
- Mohammad Moghnieh
- Jawad Al Housseini
- Mohammad Kaddah

**Topic:** Fitness & Nutrition Tracking

**Primary Data Entities:** Users, Meals, Ingredients, Exercises, Workouts, Calendar Logs, Password Resets

**Deployed Frontend (Vercel):** https://fittrack-flax.vercel.app/

**Deployed Backend (Render):** https://fittrack-t4iu.onrender.com

---

## Tech Stack

**Frontend**
- React 19, React Router v7
- Vite 8
- Tailwind CSS 3
- Axios / Fetch API
- EmailJS (contact/support form)

**Backend**
- Node.js with Express 5
- MySQL 2 (promise-based connection pool)
- JSON Web Tokens (JWT) for authentication
- bcrypt for password hashing
- Google Fit OAuth 2.0 integration
- dotenv for environment configuration

---

## Project Structure

```
fittrack/
├── db/
│   ├── fittrack.sql          # Full MySQL schema and seed data
│   └── pool.js               # MySQL connection pool
├── lib/
│   ├── activityDb.js         # DB helpers for activity/calendar data
│   └── activityStore.js      # In-memory fallback state store
├── middleware/
│   ├── auth.js               # JWT requireAuth middleware
│   ├── errorHandler.js       # Global error handler
│   └── resolveUser.js        # Resolves user from JWT or fallback header
├── routes/
│   ├── auth.js               # Register, login, password reset
│   ├── users.js              # Get/update current user profile
│   ├── survey.js             # Save and retrieve fitness survey
│   ├── activity.js           # Homepage data, calendar, workout log, saved meals
│   ├── exercises.js          # Exercise library
│   ├── meals.js              # Meal pool and meal ingredients
│   ├── ingredients.js        # Ingredient database
│   └── googlefit.js          # Google Fit OAuth and step sync
├── src/
│   ├── components/
│   │   ├── GoogleFitSync.jsx
│   │   ├── Navbar.jsx
│   │   └── ThemeToggle.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LogWorkoutPage.jsx
│   │   ├── DietProgram.jsx
│   │   ├── MealLog.jsx
│   │   ├── IngredientDetail.jsx
│   │   ├── UserProgress.jsx
│   │   ├── ExerciseDetailPage.jsx
│   │   ├── exerciseLibrary.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Register/
│   │   ├── UserProfile/
│   │   ├── WelcomePage/
│   │   ├── survey/
│   │   └── Terms/
│   ├── services/
│   │   └── api.js            # Centralised API client (fetch wrapper)
│   ├── data/
│   │   └── mockData.js       # Static exercise/meal data and helper functions
│   ├── App.jsx               # Root component, routing, shared state
│   └── main.jsx
├── server.js                 # Express entry point
├── package.json
├── vite.config.js
├── vercel.json               # Vercel frontend deployment config
└── .env                      # Environment variables (not committed)
```

---

## Setup Instructions for Running Locally

### Prerequisites

- Node.js v18 or higher — https://nodejs.org
- npm v9 or higher (comes with Node.js)
- MySQL 8 or a compatible managed MySQL instance
- Git — https://git-scm.com

### 1. Clone the repository

```bash
git clone https://github.com/mohamadkaddah-0/fittrack.git
cd fittrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (or copy the provided `.env` template) and fill in your values:

```env
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=fittrack
DB_USER=your-db-user
DB_PASS=your-db-password

# JWT
JWT_SECRET=your-jwt-secret

# Google Fit OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/googlefit/callback
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
```

### 4. Set up the database

Import the provided schema and seed data into your MySQL instance:

```bash
mysql -u your-db-user -p fittrack < db/fittrack.sql
```

### 5. Start the backend server

```bash
node server.js
```

The API will be available at `http://localhost:3000`.

### 6. Start the frontend development server

In a separate terminal:

```bash
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## API Endpoints

All API routes are prefixed with `/api`.

### Authentication — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create a new user account |
| POST | `/login` | Log in and receive a JWT |
| POST | `/forgot-password` | Request a 6-digit reset code |
| POST | `/verify-code` | Verify the reset code |
| POST | `/reset-password` | Set a new password using the verified code |

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get the authenticated user's profile |
| PUT | `/me` | Update the authenticated user's profile |

### Survey — `/api/survey`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Retrieve the authenticated user's survey data |
| POST | `/` | Save or update the user's fitness survey |

### Activity — `/api/activity`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/homepage` | Get homepage stats and calendar data for a given date |
| PATCH | `/homepage` | Update homepage stats (water, steps, plan progress) |
| GET | `/calendar` | Get full calendar data |
| POST | `/calendar` | Add a meal or workout entry to the calendar |
| DELETE | `/calendar/:entryId` | Remove a calendar entry |
| GET | `/workout-log` | Get the workout log for a given date |
| POST | `/workout-log` | Add an exercise entry to the workout log |
| POST | `/workout-log/save` | Save the workout log to the calendar |
| DELETE | `/workout-log/:entryId` | Remove a workout log entry |
| GET | `/saved-meals` | Get the user's saved custom meals |
| POST | `/saved-meals` | Save a custom meal |
| DELETE | `/saved-meals/:mealId` | Delete a saved meal |

### Exercises — `/api/exercises`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all exercises |
| GET | `/:id` | Get a single exercise by ID |

### Meals — `/api/meals`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pool` | Get all meals from the meal pool |
| GET | `/pool/:mealId` | Get ingredients for a specific meal |

### Ingredients — `/api/ingredients`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all ingredients |

### Google Fit — `/api/googlefit`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth-url` | Get the Google OAuth authorisation URL |
| GET | `/callback` | OAuth redirect handler |
| POST | `/sync` | Sync today's steps from Google Fit |
| GET | `/status` | Check if Google Fit is connected |
| DELETE | `/disconnect` | Disconnect Google Fit |

---

## Authentication

Protected routes use JWT Bearer token authentication. After a successful login or registration, the API returns a token which the frontend stores in `localStorage` under the key `fittrack_token`. All subsequent API requests include this token in the `Authorization: Bearer <token>` header.

The `resolveUser` middleware additionally accepts an `x-fittrack-user-id` header as a fallback identity for unauthenticated session activity (used during development and guest flows).

---

## Member Contributions

### Sara Ibrahim

**Diet Program** (`/diet-program`): Displays the user's personalised daily meal plan and macro targets. Calorie, protein, carbs, and fat daily targets are computed from the user's survey data using the Mifflin-St Jeor BMR formula. Workout calories burned are added to the daily calorie target in real time. Meal recommendations rotate every 3 days using a date-seeded algorithm that prioritises meal profiles matching to ±10% of the user's goal (e.g. high-protein for muscle gain). Checking a meal logs it to the calendar and updates the macro progress bars instantly.

**Meal Log** (`/meal-log`): A 3-step form for manually building and logging custom meals. Users search a database of ingredients, adjust portion sizes with live macro recalculation, and submit to the shared calendar. A sidebar shows daily budget progress against personalised targets. Users can also save custom meals for quick re-logging.

**Ingredient Detail** (`/ingredient/:id`): A detail view for individual ingredients showing full nutritional data per 100g. Portion size adjustments update all values live.

**User Progress** (`/progress`): A visual dashboard with circular ring charts for calories, protein, burned calories, and net balance. Includes a 7-day calorie bar chart, weekly summary rings, a weight trend tracker, a colour-coded activity calendar, and a personal goals checklist.

---

### Jawad Al Housseini

**Exercise Library** (`/exercises`) and **Exercise Detail** (`/exercise/:id`): Built a personalised workout experience driven by user profile data from the survey. Developed logic to generate a dynamic 14-day workout plan by combining fitness level and activity level, filtering exercises by available equipment and user limitations, and applying a goal-based cardio-to-strength ratio. The plan follows a structured design that includes rest days, variation, and balanced exercise distribution. Implemented a progress tracking system that allows users to mark exercises as completed only on the current day, and a calendar feature that displays completed exercises per date. Also built a search and filtering system for the exercise library by name, category, difficulty, and equipment.

Also contributed to the **Log Workout** page by supporting parts of the logging logic and its integration with the shared calendar.

---

### Mohammad Kaddah

**Home Page** (`/`): Developed the main dashboard. Displays the user's daily fitness stats (calories, calories burnt, water intake, exercises, steps). All stat cards are interactive. Shows current workout plan progress through a circular ring meter and a 7-day tracker. Includes an achievements section and a full interactive activity calendar shared with the Diet Program page.

**Log Workout** (`/log`): Implemented the workout logging interface. Enables users to log multiple exercises in a single session with input fields that adapt based on exercise type (weighted, bodyweight, cardio, distance). Calories burned are automatically estimated per exercise based on type and user weight and are locked once logged. Includes a built-in rest timer and saves all logged exercises to the shared activity calendar.

**App.jsx**: Responsible for the overall application structure — client-side routing, shared state management (calendar data, logged meals, user profile), and integration of all team members' pages into a single cohesive application.

---

### Mohammad Moghnieh

**Authentication & User Management**: Designed and implemented the complete authentication, onboarding, and user profile ecosystem.

**Welcome Page** (`/welcome`): The application's landing page with calls-to-action for registration and login.

**Registration** (`/register`): Secure account creation with a real-time password strength meter and validation. On registration, the user is guided directly to the onboarding survey.

**Login**: Validates credentials against the backend and updates global application state on success.

**Password Recovery Flow** (`/forgot-password`, `/reset-password`): A two-step process — the user requests a reset for their email, a 6-digit code is generated and verified, and then a new password can be set.

**Fitness Survey** (`/survey`): A comprehensive 4-step questionnaire covering basic info, fitness goals (with a Goal Analysis Algorithm for healthy rate calculation), workout preferences, and experience and lifestyle. On completion, all data is persisted to the backend via `/api/survey`.

**User Profile** (`/profile`): Inline editing of all user fields, profile picture upload with Base64 conversion, real-time validation, and syncing changes back to the backend.

**Support & Legal**: Terms of Service, Privacy Policy, and a Support page integrating live chat (Tawk.to), an email contact form (EmailJS), a searchable FAQ, and system status indicators.

---

## Deployment

**Frontend** is deployed on Vercel using the configuration in `vercel.json`. All routes are rewritten to `index.html` to support client-side routing.

**Backend** is deployed on Render at `https://fittrack-t4iu.onrender.com`. The frontend API client in `src/services/api.js` points to this URL in production.

To deploy your own instance:

1. Push the repository to GitHub.
2. Connect the repository to Vercel for the frontend. Set `buildCommand` to `npm run build` and `outputDirectory` to `dist`.
3. Deploy the backend to Render (or any Node.js host). Set all environment variables from the `.env` template in the host's dashboard.
4. Update `API_BASE` in `src/services/api.js` and `GOOGLE_REDIRECT_URI` in `.env` to match your deployed backend URL.


