**FitTrack:** Fitness Tracking Web Application

**Project Overview:** 
  FitTrack is a full-stack-ready frontend fitness tracking application built with React, Vite, and Tailwind CSS. The platform allows users to track their       diet, log workouts, monitor nutritional progress, and receive personalised meal recommendations based on their fitness profile.

**Team Members: Deployables** 
Sara Ibrahim
Mohammad Moghnieh
Jawad Al Housseini
Mohammad Kaddah
  
**Topic:** Fitness & Nutrition Tracking

**Primary Data Entities:** Users, Meals, Ingredients, Exercises, Workouts, Calendar Logs

**Deployed Application on Vercel:** https://fittrack-flax.vercel.app/


**Setup Instructions for Running Locally:**

*Prerequisites:* Make sure you have the following installed:

  Node.js v18 or higher — nodejs.org
  npm v9 or higher (comes with Node.js)
  Git — git-scm.com

*Steps:*
1. Clone the repository
bashgit clone https://github.com/mohamadkaddah-0/fittrack.git
cd fittrack
2. Install dependencies
bash npm install
3. Start the development server
bashnpm run dev
4. Open in browser
Navigate to http://localhost:5173 in your browser.


*Member Contributions:*

*Sara Ibrahim:*

Diet Program (/diet-program)
  Displays the user's personalised daily meal plan and macro targets. Calorie, protein, carbs, and fat daily targets are computed from the user's survey     data using the Mifflin-St Jeor BMR formula. Workout calories burned are added to the daily calorie target in real time. Meal recommendations rotate       every 3 days using a date-seeded algorithm that prioritises meal profiles matching to +-10% of the user's goal (e.g. high-protein for muscle gain).         Checking a meal logs it    to the shared calendar and updates the macro progress bars instantly. Note: since the mock database is still limited,     recommended meals may not add up to 10% of the daily macros yet. 
  
Meal Log (/meal-log)
  A 3-step form for manually building and logging custom meals. Users search a database of 51 ingredients, adjust portion sizes with live macro             recalculation, and submit to the shared calendar. A sidebar shows daily budget progress against personalised targets and warns the user if logging would   exceed macro limits by more than 10%. Users can also save custom meals for quick re-logging in the My Meals tab.
  
Ingredient Detail (/ingredient/:id)
  A detail view for individual ingredients showing full nutritional data per 100g. Users can adjust portion size using preset buttons or a manual input,     and all values update live. Accessible from both the Diet Program ingredient modal and the Meal Log search results.
  
User Progress (/progress)
  A visual dashboard showing daily and weekly progress. Features circular ring charts for calories, protein, burned calories, and net balance. Includes a     7-day calorie bar chart comparing eaten vs burned against the daily target, weekly summary rings, a weight trend tracker with an editable current          weight,   a colour-coded activity calendar, and a custom personal goals checklist.
  


*Jawad Al Housseini:*

Primarily responsible for designing and implementing two main pages: the Exercise Library (/exercises) and the Exercise Detail page (/exercise/:id). My contribution focused on building a personalized workout experience based on user profile data collected from the survey. I developed the logic that generates a dynamic 14-day workout plan by combining the user’s fitness level and activity level into an effective level, filtering exercises based on available equipment and user limitations, and applying a goal-based cardio-to-strength ratio. I ensured the plan follows a structured design that includes rest days, variation between days, and a balanced distribution of exercises. I also implemented a progress tracking system that allows users to mark exercises as completed only on the current day, and designed a calendar feature that displays both meals and completed exercises while ensuring that each entry appears on the correct date. In addition, I built a search and filtering system for the exercise library, allowing users to browse exercises by name, category, difficulty, and equipment availability so that only relevant exercises are shown. In addition to my assigned pages, I also contributed to the Log Workout page by supporting parts of the logging logic and its integration with the shared calendar.

A key part of my contribution involved working with the shared mock data (mockData.js) to simulate application behavior. I used structured exercise data and helper functions to retrieve user information, control workout composition based on goals, and ensure exercises are appropriate for the user’s limitations. I also worked with shared logging and calendar data to ensure that completed exercises are recorded and reflected consistently across different parts of the application. The mock data acts as an in-memory data source that simulates how a real backend system would function, allowing the application to dynamically generate plans, track activity, and update the interface without requiring a database or server. This demonstrates how data flows through the application and how different components remain synchronized while staying within the project constraints.




*Mohammad Kaddah:*

Primarily responsible for:
1. HomePage.jsx
Developed the main dashboard of the application. Displays categorized workout options (e.g., chest, abs, shoulders) along with relevant details such as duration.Designed to provide a clear and simple navigation experience, allowing users to easily browse and select workouts.

2. LogWorkoutPage.jsx
Implemented the workout logging interface. Enables users to input and record workout data (e.g., exercises, duration, sets). Supports tracking of user activity over time, forming the basis for progress monitoring and future analytics features.

As well as being in control of the App.jsx file.

Future Plans (Phase 2):
The next phase will focus on expanding functionality and improving the overall tracking system.
Planned Enhancements: Achievement Section Functionality. Activate and connect the achievement system to user activity. Introduce dynamic progress tracking and milestone-based rewards. Step Tracking Integration. Implement a system to track steps taken by the user. Use step data as an additional metric for activity tracking. Advanced Calorie Calculation. Improve total calorie burn estimation by combining: Steps taken, Logged workouts, and Logged meals. Provide a more accurate representation of user activity and fitness progress.


*Mohammad Moghnieh:*









**How Mock Data Simulates Real Interactions:** 

In Phase 1, the application has no backend. All data is simulated through mockData.js, shared React state in App.jsx, and browser storage.
User profile: After completing the survey, the user's data is saved to localStorage. On app load, getUserProfile() reads and maps this data into a currentUser object that flows to every page as a prop. This simulates an authenticated session with a real user profile fetched from a database.

Nutrition calculations: Rather than storing static targets, calcNutritionTargets(user) computes personalised daily macros on every render using BMR, TDEE, and weekly rate formulas. Two users with different goals or activity levels receive completely different targets - simulating what an API would return.

Calendar as a database: calendarData in App.jsx is a shared in-memory object keyed by date (YYYY-MM-DD). Every meal and workout logged by any page writes to this object. All pages read from it, meaning a meal logged in Meal Log instantly reflects in the Diet Program macro bars, the homepage calendar dots, and the User Progress charts. This simulates real-time database synchronisation without any network requests.

Meal recommendations: recommendMeals() uses a date-seeded pseudo-random number generator so recommendations stay stable all day, a 3-day rotation stored in localStorage to avoid repetition, and goal-aware meal profile sorting to match suggestions to the user's fitness goal. A macro tolerance check validates the combo and attempts swaps if targets aren't met — simulating a constraint-based recommendation engine.

Seed data: INITIAL_CALENDAR pre-populates the last 3 days with realistic entries using dynamic date keys, giving users a non-empty calendar from day one and simulating a returning user's history.

Ingredient database: 51 food items with accurate per-100g macros, including Lebanese foods. Portion-scaled macro calculations simulate the behaviour of an API.

Exercise plan generation — buildPlanDays() constructs a 14-day plan from the user's filtered exercise pool, respecting a 3-day repeat cooldown and alternating rest days. Equipment filtering and cardio ratio logic simulate a personalised training programme generator.


