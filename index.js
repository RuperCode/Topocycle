//Do the basic module/library requires 
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Put a message out so we know script is kicked off
console.log("Starting TopoCycle server...");

// Set up constants for the script
const PORT = 3000;

//Creat Express app
const app = express();

//Create connection to database and do a quick startup check. 
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Topocycle',
  password: '3s$RBYcReV1fSe',
  port: 5432
});

pool.query('SELECT 1', [], function(err) {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connection OK');
  }
});

// Parse form bodies (URL-encoded) and JSON if needed
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session configuration (development: in-memory store)
app.use(session({
  name: 'topocycle_session',                 // cookie name
  secret: 'change-this-secret',       // replace with a long random string for dev
  resave: false,                      // do not save unchanged sessions
  saveUninitialized: false,           // only set cookie after login or explicit use
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,                   // mitigate JS access to cookie
    secure: false,                    // set true only when serving HTTPS
    sameSite: 'lax'                   // balance CSRF protection with usability
  }
}));





// Serve static pages from "./public" 
app.use(express.static('public'));





// Registration endpoint
app.post('/api/register', function(req, res) {
  const { username, email, password } = req.body;

  console.log(`Register POSTED`);

  if (!username || !email || !password) {
    return res.status(400).send('Missing fields');
  }

  // Prohibit '@' in usernames
  if (username.includes('@')) {
    return res.status(400).send('Username cannot contain @');
  }

  bcrypt.hash(password, 12, function(err, hash) {
    if (err) return res.status(500).send('Error hashing password');

    pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hash],
      function(err2, result) {
        if (err2) {
          if (err2.code === '23505') {
            return res.status(409).send('Username or email already exists');
          }
          return res.status(500).send('Error saving user');
        }

        // Store user ID in session
        const user = result.rows[0];
        req.session.userId = user.id;

        console.log(`Login SUCCESSFUL`);

        res.json(result.rows[0]);
      }
    );
  });
});





// Login endpoint (accepts username OR email)
app.post('/api/login', function(req, res) {
  const { identifier, password } = req.body; 
  // 'identifier' can be either username or email

  console.log(`Login POSTED`);

  if (!identifier || !password) {
    return res.status(400).send('Missing fields');
  }

  // Decide whether to query by email or username
  const field = identifier.includes('@') ? 'email' : 'username';

  pool.query(
    `SELECT id, username, email, password_hash FROM users WHERE ${field} = $1`,
    [identifier],
    function(err, result) {
      if (err) return res.status(500).send('Database error');
      if (result.rows.length === 0) {
        return res.status(401).send('Invalid credentials');
      }

      const user = result.rows[0];

      bcrypt.compare(password, user.password_hash, function(err2, match) {
        if (err2) return res.status(500).send('Error checking password');
        if (!match) return res.status(401).send('Invalid credentials');

        // Store user ID in session
        req.session.userId = user.id;

        console.log(`Login SUCCESSFUL`);

        res.json({
          id: user.id,
          username: user.username,
          email: user.email
        });

      });
    }
  );
});





// Route to check if you are logged in and as which user
app.get('/api/whoami', function(req, res) {
  console.log(`WhoAmI POSTED`);
  if (!req.session.userId) {
    return res.json(null);   // 200 OK, body = null
  }

  pool.query(
    `SELECT id, username, email, FROM users WHERE id = $1`,
    [req.session.userId],
    function(err, result) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.rows.length === 0) {
        return res.status(500).json({ error: 'User no longer exists' });
      }

      const user = result.rows[0];

        res.json({
          id: user.id,
          username: user.username,
          email: user.email
        });

    }
  );
});





// Logout endpoint
app.post('/api/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('cm_session'); // name of your session cookie
    res.json({ success: true });
  });
});





// Simple health check route
app.get('/api/ping', function(req, res) {
  res.json({ ok: true });
});





app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});