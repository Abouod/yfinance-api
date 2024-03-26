import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session"; // Import express-session
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

const app = express();
const port = 3000;
const saltRounds = 10; //10: is the cost factor or the number of rounds of hashing to apply to the password.

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "rpa",
  password: "200200",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // for parsing application/json
app.use(express.static("public"));

// Configure express-session middleware
app.use(
  session({
    secret: "RPATOPSECRETKEY", // Set a secret key for session encryption
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Middleware function to check if user is authenticated
function requireLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    next(); // Continue to the next middleware or route handler
  }
}

// Route to serve the login.ejs file
app.get("/", (req, res) => {
  // Pass an empty string as the error message initially
  res.render("login.ejs", { errorMessage: "" });
});

// Update the route for index.ejs to use the requireLogin middleware
app.get("/index", requireLogin, (req, res) => {
  res.render("index.ejs");
});

app.get("/profile", requireLogin, (req, res) => {
  const user = req.session.user;
  res.render("profile.ejs", { user }); // Pass user data to the profile page
});

// Route to handle user logout
app.get("/signout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Route to handle user registration
app.post("/register", async (req, res) => {
  const { name, email, password, manager, superior, department } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database with hashed password
    const newUserQuery = await db.query(
      "INSERT INTO users (name, email, password, manager, superior, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, email, hashedPassword, manager, superior, department]
    );

    const newUser = newUserQuery.rows[0];

    // Store user data in session
    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      manager: newUser.manager,
      superior: newUser.superior,
      department: newUser.department,
    };

    res.redirect("/index");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("An error occurred while registering user");
  }
});

// Route to handle user sign-in
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    // Pass the error message to the template
    return res.render("login.ejs", {
      errorMessage: "Email and password are required",
    });
  }

  try {
    const userQuery = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userQuery.rows.length === 0) {
      // Pass the error message to the template
      return res.render("login.ejs", {
        errorMessage: "Invalid email or password",
      });
    }

    const user = userQuery.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Store user data in session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        manager: user.manager,
        superior: user.superior,
        department: user.department,
      };

      // Redirect to index.ejs upon successful login
      res.redirect("/index");
    } else {
      // Pass the error message to the template
      res.render("login.ejs", { errorMessage: "Incorrect password" });
    }
  } catch (error) {
    console.error("Error signing in:", error);
    // Pass the error message to the template
    res.render("login.ejs", {
      errorMessage: "An error occurred while signing in",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
