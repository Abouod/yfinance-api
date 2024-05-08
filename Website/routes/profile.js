import express from "express";
import { db } from "../config.js";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import requireSignin from "./authMiddleware.js"; // Import the middleware function
import multer from "multer"; // Import multer for file upload
import fs from "fs";

const router = express.Router();
const saltRounds = 10; //10: is the cost factor or the number of rounds of hashing to apply to the password.

// Multer configuration for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/uploads/"); // Define the destination folder where uploaded files will be stored
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); // Define the filename for the uploaded file
    },
  }),
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      // Accept only image files
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

async function saveImageToFile(signatureData) {
  const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
  const fileName = Date.now() + ".png"; // Generate a unique filename
  const filePath = "public/uploads/" + fileName; // Path to save the image

  await fs.promises.writeFile(filePath, base64Data, "base64"); // Write the file to disk

  return fileName; // Return the filename
}

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

    // Fetch the user's first name and last name from the database
    const userQuery = await db.query(
      "SELECT first_name, last_name, email FROM users WHERE id = $1",
      [userId]
    );

    // Check if the user exists
    if (userQuery.rows.length === 0) {
      // Handle the case where the user does not exist
      return res.status(404).send("User not found");
    }

    // Extract the user's first name and last name from the query result
    const { first_name, last_name, email } = userQuery.rows[0];

    // Render the profile page template and pass the user details
    res.render("profile.ejs", {
      firstName: first_name,
      lastName: last_name,
      emailAddress: email,
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
router.post(
  "/save-profile",
  requireSignin,
  upload.single("signature"),
  async (req, res) => {
    const userId = req.session.user.id;
    const {
      department,
      employee_id,
      job_title,
      superior_name,
      superior_id,
      superior_email,
      division,
      manager_name,
      manager_id,
      manager_email,
      phone_number,
      address,
      bank_name,
      bank_account,
      passport,
    } = req.body;

    try {
      // Check if user details already exist in the database
      const userDetailsQuery = await db.query(
        "SELECT * FROM details WHERE user_id = $1",
        [userId]
      );

      // Check if a file was uploaded
      let signatureFileName;
      if (req.file) {
        signatureFileName = req.file.filename;
      } else if (req.body.signatureData) {
        // If no file was uploaded but signature data is present, save it as an image
        signatureFileName = await saveImageToFile(req.body.signatureData);
      }

      if (userDetailsQuery.rows.length === 0) {
        // Insert new user details
        await db.query(
          "INSERT INTO details (user_id, department, superior_name, manager_name, phone_number, job_title, division, employee_id, superior_id, superior_email, manager_id, manager_email, address, bank_name, bank_account, passport, signature) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)",
          [
            userId,
            department,
            superior_name,
            manager_name,
            phone_number,
            job_title,
            division,
            employee_id,
            superior_id,
            superior_email,
            manager_id,
            manager_email,
            address,
            bank_name,
            bank_account,
            passport,
            signatureFileName, // Use the filename if uploaded
          ]
        );
      } else {
        // Update existing user details
        await db.query(
          "UPDATE details SET department = $1, superior_name = $2, manager_name = $3, phone_number = $4, job_title = $5, division = $6, employee_id = $7, superior_id = $8, superior_email = $9, manager_id = $10, manager_email = $11, address = $12, bank_name = $13, bank_account = $14, passport = $15, signature = $16 WHERE user_id = $17",
          [
            department,
            superior_name,
            manager_name,
            phone_number,
            job_title,
            division,
            employee_id,
            superior_id,
            superior_email,
            manager_id,
            manager_email,
            address,
            bank_name,
            bank_account,
            passport,
            signatureFileName, // Use the filename if uploaded
            userId,
          ]
        );
      }

      // Fetch the user's first name and last name from the database
      const userQuery = await db.query(
        "SELECT first_name, last_name, email FROM users WHERE id = $1",
        [userId]
      );

      // Extract user details and pr_count from the query result
      const { first_name, last_name, email } = userQuery.rows[0];

      // After saving/updating user profile, fetch the updated user details
      const updatedUserDetails = await db.query(
        "SELECT * FROM details WHERE user_id = $1",
        [userId]
      );

      res.render("profile.ejs", {
        firstName: first_name,
        lastName: last_name,
        emailAddress: email,
        userDetails: updatedUserDetails.rows[0], // Pass the updated user details
        successMessage: "Profile saved successfully!",
        errorMessage: "",
      });
    } catch (error) {
      console.error("Error saving/updating profile:", error);
      res.status(500).render("profile.ejs", {
        firstName: first_name,
        lastName: last_name,
        emailAddress: email,
        userDetails: updatedUserDetails.rows[0], // Pass the updated user details
        errorMessage: "An error occurred while saving/updating profile",
        successMessage: "",
      });
    }
  }
);

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
    // Fetch the user's first name and last name from the database
    const userQuery = await db.query(
      "SELECT first_name, last_name, email, password FROM users WHERE id = $1",
      [userId]
    );

    // Extract user details and pr_count from the query result
    const { first_name, last_name, email, password } = userQuery.rows[0];

    if (userQuery.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const passwordMatch = await bcrypt.compare(currentPassword, password);

    if (!passwordMatch) {
      return res.status(400).render("profile.ejs", {
        firstName: first_name,
        lastName: last_name,
        emailAddress: email,
        errorMessage: "Current password is incorrect",
        userDetails: {}, // Pass an empty object for now
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).render("profile.ejs", {
        firstName: first_name,
        lastName: last_name,
        emailAddress: email,
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
      firstName: first_name,
      lastName: last_name,
      emailAddress: email,
      successMessage: "Password updated successfully!",
      errorMessage: "", // Ensure to provide errorMessage variable
      userDetails: userDetails, // Pass the fetched user details
    });
  } catch (error) {
    console.error("Error updating password:", error);
    // Pass the required variables even in case of an error
    res.status(500).render("profile.ejs", {
      firstName: first_name,
      lastName: last_name,
      emailAddress: email,
      errorMessage: "An error occurred while updating password",
      successMessage: "", // Ensure to provide successMessage variable
      userDetails: {}, // Pass an empty object for now
    });
  }
});

export default router;
