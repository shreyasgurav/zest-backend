const express = require("express");
const mysql = require("mysql2");
const { auth } = require('express-oauth2-jwt-bearer');
const router = express.Router();
const cors = require("cors");
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// Auth0 middleware configuration
const checkJwt = auth({
  audience: 'https://dev-fcvminbx3u0yygnt.us.auth0.com/api/v2/',
  issuerBaseURL: 'dev-fcvminbx3u0yygnt.us.auth0.com',
});

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sdg#0619",
  database: "Zest",
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Zest Event API");
});

// Profile Status Endpoints
app.get('/api/profile/status', checkJwt, (req, res) => {
  const userId = req.auth.payload.sub;
  
  db.query(
    'SELECT id, is_profile_completed FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error checking profile status:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (results.length === 0) {
        db.query(
          'INSERT INTO users (id, is_profile_completed) VALUES (?, false)',
          [userId],
          (err) => {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            return res.json({ isProfileCompleted: false });
          }
        );
      } else {
        res.json({ isProfileCompleted: results[0].is_profile_completed });
      }
    }
  );
});

// Event Endpoints
app.get('/api/events', (req, res) => {
  const query = `
    SELECT 
      id,
      event_type,
      event_image,
      event_title,
      hosting_club,
      event_date_time,
      event_venue,
      event_registration_link,
      about_event,
      created_at
    FROM events
    ORDER BY event_date_time ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Add event/workshop/experience
app.post("/api/add-event", (req, res) => {
  const {
    event_type,
    event_image,
    event_title,
    hosting_club,
    event_date_time,
    event_venue,
    event_registration_link,
    about_event,
  } = req.body;

  if (
    !event_type ||
    !event_image ||
    !event_title ||
    !hosting_club ||
    !event_date_time ||
    !event_venue ||
    !event_registration_link ||
    !about_event
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    INSERT INTO events (
      event_type,
      event_image, 
      event_title, 
      hosting_club, 
      event_date_time, 
      event_venue, 
      event_registration_link, 
      about_event
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    event_type,
    event_image,
    event_title,
    hosting_club,
    event_date_time,
    event_venue,
    event_registration_link,
    about_event,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({ message: "Failed to add event", error: err.message });
    } else {
      const typeText = 
        event_type === 'workshop' ? 'Workshop' : 
        event_type === 'experiences' ? 'Experiences' : 'Event';
      res.status(201).json({ 
        message: `${typeText} added successfully`, 
        id: result.insertId 
      });
    }
  });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});