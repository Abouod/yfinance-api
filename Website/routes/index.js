import express from "express";
import { db } from "../config.js";
import requireSignin from "./authMiddleware.js"; // Import the middleware function

const router = express.Router();

router.get("/", requireSignin, async (req, res) => {
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

export default router;
