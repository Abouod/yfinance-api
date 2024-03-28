import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session"; // Import express-session
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

const app = express();
const port = 3000;
const saltRounds = 10; //10: is the cost factor or the number of rounds of hashing to apply to the password.
//The greater the number the harder it is to decrypt the hash.

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
    secret: "RPATOPSECRETENCRYPTIONKEY", // Set a secret key for session encryption
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //Cookie to maintain session activity for a day 1000 miliseconds (1 second) x 60 x 60 minutes * 24 hours
    },
  })
);

// Middleware function to check if user is authenticated
function requireSignin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    next(); // Continue to the next middleware or route handler
  }
}

// Route to serve the signin.ejs file
app.get("/", (req, res) => {
  // Pass an empty string as the error message initially
  res.render("signin.ejs", {
    errorMessage: "",
  });
});

// Route to serve the signin.ejs file
app.get("/signup", (req, res) => {
  // Pass an empty string as the error message initially
  res.render("signup.ejs", {
    errorMessage: "",
  });
});

// Update the route for index.ejs to use the requireSignin middleware
app.get("/index", requireSignin, (req, res) => {
  const userDepartment = req.session.user.department; //Getting user department from the session
  res.render("index.ejs", { userDepartment });
});

// Route to serve the profile page
app.get("/profile", requireSignin, (req, res) => {
  const user = req.session.user;
  res.render("profile.ejs", { user, errorMessage: "" }); // Pass user data and an empty errorMessage
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
    // Extract domain from email
    const domain = email.split("@")[1];

    // Check if domain is allowed
    const allowedDomain = "sophicautomation.com"; // Change this to your allowed domain
    if (domain !== allowedDomain) {
      // Domain not allowed, reject registration
      return res.render("signup.ejs", {
        errorMessage: "Registration with this email domain is not allowed",
      });
    }

    const userQuery = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userQuery.rows.length > 0) {
      // Pass the error message to the template
      return res.render("signup.ejs", {
        errorMessage: "User Already Exists",
      });
    }

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
    return res.render("signin.ejs", {
      errorMessage: "Email and password are required",
    });
  }

  try {
    const userQuery = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userQuery.rows.length === 0) {
      // Pass the error message to the template
      return res.render("signin.ejs", {
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

      // Redirect to index.ejs upon successful signin
      res.redirect("/index");
    } else {
      // Pass the error message to the template
      res.render("signin.ejs", { errorMessage: "Incorrect password" });
    }
  } catch (error) {
    console.error("Error signing in:", error);
    // Pass the error message to the template
    res.render("signin.ejs", {
      errorMessage: "An error occurred while signing in",
    });
  }
});

// Route to handle password update
app.post("/update-password", requireSignin, async (req, res) => {
  const userId = req.session.user.id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    const userQuery = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (userQuery.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const user = userQuery.rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).render("profile.ejs", {
        user: req.session.user,
        errorMessage: "Current password is incorrect",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).render("profile.ejs", {
        user: req.session.user,
        errorMessage: "Passwords do not match",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedNewPassword,
      userId,
    ]);

    res.redirect("/profile"); // Redirect to profile page after password update
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).render("profile.ejs", {
      user: req.session.user,
      errorMessage: "An error occurred while updating password",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
