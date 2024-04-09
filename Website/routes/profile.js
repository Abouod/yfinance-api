import express from "express";
import { db } from "../config.js";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import requireSignin from "./authMiddleware.js"; // Import the middleware function

const router = express.Router();
const saltRounds = 10; //10: is the cost factor or the number of rounds of hashing to apply to the password.

// Route to serve the profile page
router.get("/profile", requireSignin, async (req, res) => {
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
router.get("/save-profile", (req, res) => {
  // Redirect the user to the profile page
  res.redirect("/userProfile/profile");
});
// Route to handle saving/updating user profile
router.post("/save-profile", requireSignin, async (req, res) => {
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

// Route to handle GET requests to /save-profile
router.get("/update-password", (req, res) => {
  // Redirect the user to the profile page
  res.redirect("/userProfile/profile");
});
// Route to handle password update
router.post("/update-password", requireSignin, async (req, res) => {
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

export default router;
