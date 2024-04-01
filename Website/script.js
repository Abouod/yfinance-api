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

app.get("/index", requireSignin, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Fetch user details including department from the database
    const userDetailsQuery = await db.query(
      "SELECT * FROM details WHERE user_id = $1",
      [userId]
    );

    let userDepartment = null;

    if (userDetailsQuery.rows.length === 0) {
      // No user details found, redirect to the profile page to provide details
      // You can choose to handle this differently if needed
      // For now, let's set userDepartment to null
      // You can customize this behavior based on your requirements
    } else {
      const userDetails = userDetailsQuery.rows[0];
      userDepartment = userDetails.department;
    }

    // Render the index page template and pass the user department
    res.render("index.ejs", {
      userDepartment,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("index.ejs", {
      errorMessage: "An error occurred while fetching user details",
    });
  }
});

// Route to serve the profile page
app.get("/profile", requireSignin, async (req, res) => {
  const userId = req.session.user.id;

  try {
    // Fetch user details from the database based on user ID
    const userDetailsQuery = await db.query(
      "SELECT * FROM details WHERE user_id = $1",
      [userId]
    );

    let userDetails = null; // Initialize userDetails as null

    if (userDetailsQuery.rows.length > 0) {
      // If userDetails found, assign it to the userDetails variable
      userDetails = userDetailsQuery.rows[0];
    }

    // Render the profile page template and pass the user details
    res.render("profile.ejs", {
      user: req.session.user,
      userDetails: userDetails, // Pass userDetails here
      errorMessage: "",
      successMessage: "",
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("profile.ejs", {
      user: req.session.user,
      errorMessage: "An error occurred while fetching user details",
    });
  }
});

// Route to handle GET requests to /save-profile
app.get("/save-profile", (req, res) => {
  // Redirect the user to the profile page
  res.redirect("/profile");
});

// Route to handle user logout
app.get("/signout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Route to handle user registration
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Extract domain from email
    const domain = email.split("@")[1];

    // Check if domain is allowed
    const allowedDomain = "sophicautomation.com"; // Allowed domain
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
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    const newUser = newUserQuery.rows[0];

    // Store user data in session
    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
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
        userDetails: {}, // Initialize userDetails as empty object
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).render("profile.ejs", {
        user: req.session.user,
        errorMessage: "Passwords do not match",
        userDetails: {}, // Initialize userDetails as empty object
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedNewPassword,
      userId,
    ]);

    // Pass success message when redirecting to profile page
    res.render("profile.ejs", {
      user: req.session.user,
      successMessage: "Password updated successfully!",
      errorMessage: "", // Ensure to provide errorMessage variable
      userDetails: {}, // Initialize userDetails as empty object
    });
  } catch (error) {
    console.error("Error updating password:", error);
    // Pass the required variables even in case of an error
    res.status(500).render("profile.ejs", {
      user: req.session.user,
      errorMessage: "An error occurred while updating password",
      successMessage: "", // Ensure to provide successMessage variable
      userDetails: {}, // Initialize userDetails as empty object
    });
  }
});

// Route to handle saving/updating user profile
app.post("/save-profile", requireSignin, async (req, res) => {
  const userId = req.session.user.id;
  const { department, superior, manager, phonenumber, jobtitle, division } =
    req.body;

  try {
    // Check if user details already exist in the database
    const userDetailsQuery = await db.query(
      "SELECT * FROM details WHERE user_id = $1",
      [userId]
    );

    if (userDetailsQuery.rows.length === 0) {
      // Insert new user details
      await db.query(
        "INSERT INTO details (user_id, department, superior, manager, phonenumber, jobtitle, division) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [userId, department, superior, manager, phonenumber, jobtitle, division]
      );
    } else {
      // Update existing user details
      await db.query(
        "UPDATE details SET department = $1, superior = $2, manager = $3, phonenumber = $4, jobtitle = $5, division = $6 WHERE user_id = $7",
        [department, superior, manager, phonenumber, jobtitle, division, userId]
      );
    }

    res.render("profile.ejs", {
      user: req.session.user,
      userDetails: req.body, // Pass the updated user details
      successMessage: "Profile saved successfully!",
      errorMessage: "",
    });
  } catch (error) {
    console.error("Error saving/updating profile:", error);
    res.status(500).render("profile.ejs", {
      user: req.session.user,
      userDetails: req.body, // Pass the submitted user details back to the template
      errorMessage: "An error occurred while saving/updating profile",
      successMessage: "",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
