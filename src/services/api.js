const API_BASE = "https://fittrack-t4iu.onrender.com";

const getToken = () => localStorage.getItem("fittrack_token");

const getSessionUserId = () => {
  try {
    const sessionUser = sessionStorage.getItem("currentUser");
    if (!sessionUser) {
      return null;
    }

    const parsed = JSON.parse(sessionUser);
    return parsed?.id ? String(parsed.id) : null;
  } catch (error) {
    return null;
  }
};

const buildHeaders = (extraHeaders = {}) => {
  const token = getToken();
  const sessionUserId = getSessionUserId();
  const resolvedHeaders = {
    ...extraHeaders,
  };

  if (token) {
    resolvedHeaders.Authorization = `Bearer ${token}`;
  }

  if (sessionUserId) {
    resolvedHeaders["x-fittrack-user-id"] = sessionUserId;
  }

  return resolvedHeaders;
};

const parseJson = async (response) => {
  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const request = (path, options = {}) =>
  fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  }).then(parseJson);

const jsonRequest = (path, method, body) =>
  request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

const api = {
  hasActivityIdentity: () => Boolean(getToken() || getSessionUserId()),

  // Auth
  login: (email, password) =>
    jsonRequest("/auth/login", "POST", { email, password }),

  register: (userData) =>
    jsonRequest("/auth/register", "POST", userData),

  forgotPassword: (email) =>
    jsonRequest("/auth/forgot-password", "POST", { email }),

  resetPassword: (email, code, newPassword) =>
    jsonRequest("/auth/reset-password", "POST", { email, code, newPassword }),

  // User
  getCurrentUser: () => request("/users/me"),

  updateUser: (data) =>
    jsonRequest("/users/me", "PUT", data),

  // Survey
  getSurvey: () => request("/survey"),

  saveSurvey: (data) =>
    jsonRequest("/survey", "POST", data),

  // Activity / homepage
  getHomepageData: (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return request(`/activity/homepage${query}`);
  },

  updateHomepageData: (data) =>
    jsonRequest("/activity/homepage", "PATCH", data),

  deleteCalendarEntry: (entryId, date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return request(`/activity/calendar/${encodeURIComponent(entryId)}${query}`, {
      method: "DELETE",
    });
  },

  getCalendarData: () => request("/activity/calendar"),

  addCalendarEntry: (date, entry) =>
    jsonRequest("/activity/calendar", "POST", { date, entry }),

  // Activity / workout log
  getWorkoutLog: (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return request(`/activity/workout-log${query}`);
  },

  addWorkoutLogEntry: (data) =>
    jsonRequest("/activity/workout-log", "POST", data),

  saveWorkoutLogToCalendar: (date) =>
    jsonRequest("/activity/workout-log/save", "POST", { date }),

  deleteWorkoutLogEntry: (entryId, date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return request(`/activity/workout-log/${encodeURIComponent(entryId)}${query}`, {
      method: "DELETE",
    });
  },
  // Saved meals
  getSavedMeals: () => request("/activity/saved-meals"),
  addSavedMeal: (meal) => jsonRequest("/activity/saved-meals", "POST", meal),
  deleteSavedMeal: (mealId) => request(`/activity/saved-meals/${encodeURIComponent(mealId)}`, { method: "DELETE" }),
};
export default api;
