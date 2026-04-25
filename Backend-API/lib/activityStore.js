const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const storePath = path.join(dataDir, 'activity-store.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(
      storePath,
      JSON.stringify({ users: {} }, null, 2),
      'utf8'
    );
  }
}

function readStore() {
  ensureStore();

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.users || typeof parsed.users !== 'object') {
      return { users: {} };
    }
    return parsed;
  } catch (error) {
    return { users: {} };
  }
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
}

function getUserState(userKey) {
  const store = readStore();

  if (!store.users[userKey]) {
    store.users[userKey] = {
      hydrationByDate: {},
      stepsByDate: {},
      planProgress: {
        daysCompleted: 0,
        totalDays: 7,
        updatedAt: null,
      },
      calendarData: {},
      workoutLogByDate: {},
    };
    writeStore(store);
  }

  return {
    store,
    userState: store.users[userKey],
  };
}

function saveUserState(userKey, userState) {
  const store = readStore();
  store.users[userKey] = userState;
  writeStore(store);
  return store.users[userKey];
}

module.exports = {
  getUserState,
  saveUserState,
};
