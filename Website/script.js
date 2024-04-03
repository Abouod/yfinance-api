import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session"; // Import express-session
import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import env from "dotenv";
import { v4 as uuidv4 } from "uuid"; // Import uuid library for generating unique tokens
import nodemailer from "nodemailer";

const app = express();
const port = 3000;
const saltRounds = 10; //10: is the cost factor or the number of rounds of hashing to apply to the password.
//The greater the number the harder it is to decrypt the hash.
env.config(); //Load environement variables from .env file

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // for parsing application/json
app.use(express.static("public"));

// Configure express-session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Set a secret key for session encryption
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //Cookie to maintain session activity for a day 1000 miliseconds (1 second) x 60 x 60 minutes * 24 hours
    },
  })
);

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST, // Specify the SMTP host
  port: process.env.MAILER_PORT, // Specify the SMTP port
  secure: true, // Set to true if using SSL/TLS
  auth: {
    user: process.env.USER_EMAIL, // SMTP username
    pass: process.env.USER_PASS, // SMTP password
  },
  tls: {
    rejectUnauthorized: true, // (false) Accept self-signed certificates without rejecting the connection
  },
});

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

// Route to handle email verification
app.get("/verify", async (req, res) => {
  try {
    // Extract the verification token from the request query parameters
    const { token } = req.query;

    // If no token is provided, redirect to /verifyFail
    if (!token) {
      return res.render("verifyFail.ejs");
    }

    // Retrieve user information based on the verification token
    const userQuery = await db.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    // Check if a user with the provided verification token exists
    if (userQuery.rows.length === 0) {
      // No user found with the provided token
      return res.render("verifyFail.ejs");
    }

    const user = userQuery.rows[0];

    // Check if the user's email is already verified
    if (user.email_verified) {
      // Redirect to verifySuccess.ejs with appropriate message
      return res.render("verifySuccess.ejs", {
        message: "Email already verified",
      });
    }

    // Update user's email_verified status in the database
    await db.query("UPDATE users SET email_verified = true WHERE id = $1", [
      user.id,
    ]);

    // Redirect to verifySuccess.ejs if verification is successful
    return res.render("verifySuccess.ejs", {
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).render("verifyFail.ejs", {
      errorMessage: "An error occurred while verifying email",
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
  const { firstName, lastName, email, password } = req.body;

  try {
    // Generate a unique verification token
    const verificationToken = uuidv4();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database with hashed password and verification token
    const newUserQuery = await db.query(
      "INSERT INTO users (first_name, last_name, email, password, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [firstName, lastName, email, hashedPassword, verificationToken]
    );

    const newUser = newUserQuery.rows[0];

    // Send verification email
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: "Sophic RPA Email Verification",
      text: `Click the following link to verify your email: http://localhost:3000/verify?token=${verificationToken}`,
    };

    // Wait for the email to be sent before redirecting
    await transporter.sendMail(mailOptions);

    // Render the verify.ejs page after sending the email
    res.render("verify.ejs", {
      firstName, // Extracting the first name
    });
  } catch (error) {
    // Check if the error is due to duplicate key violation (email already exists)
    if (error.code === "23505" && error.constraint === "users_email_key") {
      // Render the signup page with an error message indicating duplicate email
      return res.render("signup.ejs", {
        errorMessage:
          "Email address already exists. Please use a different email.",
      });
    }

    console.error("Error registering user:", error);
    // Log the error message and stack trace
    console.error(error.stack);
    // Render a generic error page with a 500 status code
    res.status(500).send("An error occurred while registering user");
  }
});

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

    // Check if the user's email isn't verified
    if (!user.email_verified) {
      // Generate a new verification token
      const verificationToken = uuidv4();

      // Update the verification token in the database
      await db.query("UPDATE users SET verification_token = $1 WHERE id = $2", [
        verificationToken,
        user.id,
      ]);

      // Send verification email
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: email,
        subject: "Sophic RPA Email Verification",
        text: `Click the following link to verify your email: http://localhost:3000/verify?token=${verificationToken}`,
      };

      await transporter.sendMail(mailOptions);

      // Render the verify.ejs page after sending the email
      return res.render("verify.ejs", {
        firstName: user.first_name,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Store user data in session
      req.session.user = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
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
        userDetails: {}, // Pass an empty object for now
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).render("profile.ejs", {
        user: req.session.user,
        errorMessage: "Passwords do not match",
        userDetails: {}, // Pass an empty object for now
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedNewPassword,
      userId,
    ]);

    // Fetch user details again after updating the password
    const userDetailsQuery = await db.query(
      "SELECT * FROM details WHERE user_id = $1",
      [userId]
    );
    const userDetails =
      userDetailsQuery.rows.length > 0 ? userDetailsQuery.rows[0] : null;

    // Pass success message when redirecting to profile page
    res.render("profile.ejs", {
      user: req.session.user,
      successMessage: "Password updated successfully!",
      errorMessage: "", // Ensure to provide errorMessage variable
      userDetails: userDetails, // Pass the fetched user details
    });
  } catch (error) {
    console.error("Error updating password:", error);
    // Pass the required variables even in case of an error
    res.status(500).render("profile.ejs", {
      user: req.session.user,
      errorMessage: "An error occurred while updating password",
      successMessage: "", // Ensure to provide successMessage variable
      userDetails: {}, // Pass an empty object for now
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
