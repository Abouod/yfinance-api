import express from "express";
import { db } from "../config.js";
import requireSignin from "./authMiddleware.js"; // Import the middleware function

const router = express.Router();

//YYMMDD format for the date
function getFormattedDate() {
  const today = new Date();
  const year = String(today.getFullYear()).slice(-2); // Get last two digits of the year
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return year + month + day;
}

//Route to handle GET requests to /submit
router.get("/submit", (req, res) => {
  // Redirect the user to the purchase Page post submitting
  res.redirect("/purchase");
});

// Route to handle form submission and save data to the database
router.post("/submit", requireSignin, async (req, res) => {
  const userId = req.session.user.id;
  try {
    await db.query("BEGIN"); // Start a transaction

    // Retrieve prCount and lastSubmissionDate from the database
    const prCountQuery = await db.query(
      "SELECT pr_count FROM purchase_request WHERE user_id = $1",
      [userId]
    );
    const lastSubmissionDateQuery = await db.query(
      "SELECT last_submission_date FROM purchase_request WHERE user_id = $1",
      [userId]
    );

    // Fetch the user's first name and last name again from the database
    const userQuery = await db.query(
      "SELECT first_name, last_name FROM users WHERE id = $1",
      [userId]
    );

    // Extract user details and pr_count from the query result
    const { first_name, last_name } = userQuery.rows[0];

    let prCount = prCountQuery.rows[0]?.pr_count || 1;
    let lastSubmissionDate =
      lastSubmissionDateQuery.rows[0]?.last_submission_date || null;

    // Check if it's a new day, reset prCount if necessary
    if (lastSubmissionDate !== getFormattedDate()) {
      prCount = 1;
      lastSubmissionDate = getFormattedDate(); // Update lastSubmissionDate

      // Update prCount in the database for the current user
      await db.query(
        "UPDATE purchase_request SET pr_count = $1, last_submission_date = $2 WHERE user_id = $3",
        [prCount, getFormattedDate(), userId]
      );
    }

    // If prCount and lastSubmissionDate are not present in the db, initialize them
    if (!prCount || !lastSubmissionDate) {
      prCount = 1;
      lastSubmissionDate = getFormattedDate();
      prCount += 1; // Increment prCount for each submission
    } else {
      prCount += 1; // Increment prCount for each submission
    }

    const requisitionNo = `PR${first_name.charAt(0)}${last_name.charAt(
      0
    )}-${getFormattedDate()}${prCount.toString().padStart(3, "0")}`;

    // Insert data into the purchase_request table for each item
    await db.query(
      `INSERT INTO purchase_request (user_id, requisition_no, pr_count, last_submission_date)
       VALUES ($1, $2, $3, $4)`,
      [
        userId,
        requisitionNo,
        prCount, // Insert prCount
        lastSubmissionDate, // Insert lastSubmissionDate into the database
      ]
    );

    await db.query("COMMIT"); // Commit the transaction

    // Update prCount and lastSubmissionDate in the database
    await db.query(
      "UPDATE purchase_request SET pr_count = $1, last_submission_date = $2 WHERE user_id = $3",
      [prCount, lastSubmissionDate, userId]
    );

    // Render the purchase page with a success message
    res.render("purchaseRequest.ejs", {
      firstName: first_name,
      lastName: last_name,
      requisitionNo: requisitionNo, // Pass the generated requisitionNo to populate the input field
      getFormattedDate: getFormattedDate, // Pass the function to the template
      errorMessage: "", // Pass an empty string as the error message initially
      successMessage: "Purchase request submitted successfully.", // Update success message
    });
  } catch (error) {
    await db.query("ROLLBACK"); // Rollback the transaction in case of error
    console.error("Error saving purchase request:", error);
    // Handle errors appropriately, such as rendering an error page
    res.status(500).render("purchaseRequest.ejs", {
      errorMessage: "An error occurred while saving the purchase request",
      successMessage: "", // Update success message
    });
  }
});

router.get("/", requireSignin, async (req, res) => {
  try {
    // Get the user's ID from the session
    const userId = req.session.user.id;

    // Retrieve prCount and lastSubmissionDate from the database
    const prCountQuery = await db.query(
      "SELECT pr_count FROM purchase_request WHERE user_id = $1",
      [userId]
    );
    const lastSubmissionDateQuery = await db.query(
      "SELECT last_submission_date FROM purchase_request WHERE user_id = $1",
      [userId]
    );

    let prCount = prCountQuery.rows[0]?.pr_count || 1;
    let lastSubmissionDate =
      lastSubmissionDateQuery.rows[0]?.last_submission_date || null;

    // Check if it's a new day, reset prCount if necessary
    if (lastSubmissionDate !== getFormattedDate()) {
      prCount = 1;
      lastSubmissionDate = getFormattedDate(); // Update lastSubmissionDate

      // Update prCount in the database for the current user
      await db.query(
        "UPDATE purchase_request SET pr_count = $1, last_submission_date = $2 WHERE user_id = $3",
        [prCount, getFormattedDate(), userId]
      );
    }

    // If prCount and lastSubmissionDate are not present in the db, initialize them
    if (!prCount || !lastSubmissionDate) {
      prCount = 1;
      lastSubmissionDate = getFormattedDate();
    }

    // Fetch the user's first name and last name from the database
    const userQuery = await db.query(
      "SELECT first_name, last_name FROM users WHERE id = $1",
      [userId]
    );

    // Check if the user exists
    if (userQuery.rows.length === 0) {
      // Handle the case where the user does not exist
      return res.status(404).send("User not found");
    }

    // Extract the user's first name and last name from the query result
    const { first_name, last_name } = userQuery.rows[0];

    // Generate requisitionNo by concatenating PR prefix, user initials, formatted date, and prCount
    const requisitionNo = `PR${first_name.charAt(0)}${last_name.charAt(
      0
    )}-${getFormattedDate()}${prCount.toString().padStart(3, "0")}`;

    // Render the purchaseRequest.ejs template and pass the concatenated string
    res.render("purchaseRequest.ejs", {
      firstName: first_name,
      lastName: last_name,
      requisitionNo: requisitionNo, // Pass the generated requisitionNo to populate the input field
      getFormattedDate: getFormattedDate, // Pass the function to the template
      errorMessage: "", // Pass an empty string as the error message initially
      successMessage: "", // Pass an empty string as the success message initially
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("purchaseRequest.ejs", {
      errorMessage: "An error occurred while fetching user details",
      successMessage: "",
    });
  }
});

export default router;
