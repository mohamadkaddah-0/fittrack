require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const mealsRouter      = require('./routes/meals');
const ingredientsRouter = require('./routes/ingredients');

app.use('/api/meals',       mealsRouter);
app.use('/api/ingredients', ingredientsRouter);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/survey', require('./routes/survey'));
app.use('/api/activity', require('./routes/activity'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
