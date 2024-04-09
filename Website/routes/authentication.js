import express from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid"; // Import uuid library for generating unique tokens
import { db, transporter } from "../config.js";

const router = express.Router();
const saltRounds = 10; //10: is the cost factor or the number of rounds of hashing to apply to the password.

// Route to handle user registration
router.post("/register", async (req, res) => {
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

router.post("/signin", async (req, res) => {
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

// Route to handle user Sign out
router.get("/signout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

export default router;
