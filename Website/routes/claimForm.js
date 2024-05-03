import express from "express";
import { db } from "../config.js";
import requireSignin from "./authMiddleware.js"; // Import the middleware function

const router = express.Router();

// Route to serve the profile page
router.get("/", requireSignin, async (req, res) => {
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
    // Render the claimForm page template and pass the user details
    res.render("claimForm.ejs", {
      user: req.session.user,
      userDetails: userDetails, // Pass userDetails here
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("claimForm.ejs", {
      user: req.session.user,
    });
  }
});

export default router;
