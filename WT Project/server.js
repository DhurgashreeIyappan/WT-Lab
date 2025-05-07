const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'frontend' folder
app.use(express.static(path.join(__dirname, 'frontend')));

// MongoDB connection
mongoose.connect('mongodb://localhost/pharmaSys', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

// Register route
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send({ message: 'Email already exists!' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role
  });

  try {
    await newUser.save();
    res.status(200).send({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).send({ message: 'Error registering user.' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send({ message: 'User not found!' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send({ message: 'Invalid credentials!' });
  }

  // Check role and redirect to the appropriate dashboard
  if (user.role === 'admin') {
    res.status(200).send({ message: 'Login successful!', redirect: '/admin-dashboard.html' });
  } else if (user.role === 'pharmacist') {
    res.status(200).send({ message: 'Login successful!', redirect: '/pharmacist-dashboard.html' });
  } else {
    res.status(200).send({ message: 'Login successful!', redirect: '/customer-dashboard.html' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
