import express from "express";
import { db } from "../config.js";

const router = express.Router();

// Route to handle email verification
router.get("/", async (req, res) => {
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

export default router;
