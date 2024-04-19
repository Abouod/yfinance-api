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
  try {
    await db.query("BEGIN"); // Start a transaction
    // Extract data from the request body
    const {
      fullName,
      requestDate,
      customerName,
      onlinePurchase,
      quotationNo,
      prType,
      SPC,
      TFP,
      customerPo,
      supplierName,
      projectDescription,
      ST,
      itemNumber,
      description,
      partNumber,
      brand,
      dateRequired,
      quantity,
      currency,
      unitPrice,
      totalPrice,
      internalUse,
      purchaseDepartment,
      deliveryTerm,
      leadTime,
      tax,
      exwork,
    } = req.body;

    // Retrieve prCount and lastSubmissionDate from the database
    const prCountQuery = await db.query(
      "SELECT pr_count FROM purchase_request WHERE user_id = $1",
      [req.session.user.id]
    );
    const lastSubmissionDateQuery = await db.query(
      "SELECT last_submission_date FROM purchase_request WHERE user_id = $1",
      [req.session.user.id]
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
      prCount += 1; // Increment prCount for each submission
    } else {
      prCount += 1; // Increment prCount for each submission
    }

    // Split the fullName into firstName and lastName
    const [firstName, lastName] = fullName.split(" ");

    // Check if tax field is empty or undefined
    // If it is, set it to null or any other appropriate default value
    const taxValue = tax !== undefined && tax !== "" ? tax : null; //! Can be adjusted to whatever makes sense in this case (Just to prevent pg insertion error)

    // Check the initial value of prCount
    // console.log("Initial prCount:", prCount);

    // Check the value of prCount after potential increment
    // console.log("prCount after potential increment:", prCount);

    const requisitionNo = `PR${firstName.charAt(0)}${lastName.charAt(
      0
    )}-${getFormattedDate()}${prCount.toString().padStart(3, "0")}`;

    // Insert data into the purchase_request table
    await db.query(
      `INSERT INTO purchase_request (user_id, request_by, request_date, customer_name, requisition_no, online_purchase, quotation_no, pr_type, project_category, type_for_purchase, customer_po, supplier_name, project_description, supplier_type, item, description, part_no, brand, date_required, quantity, currency, unit_price, total_price, internal_use, purchase_department, delivery_term, lead_time, tax, exwork, pr_count, last_submission_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`,
      [
        req.session.user.id,
        fullName,
        requestDate,
        customerName,
        requisitionNo,
        onlinePurchase,
        quotationNo,
        prType,
        SPC,
        TFP,
        customerPo,
        supplierName,
        projectDescription,
        ST,
        itemNumber,
        description,
        partNumber,
        brand,
        dateRequired,
        quantity,
        currency,
        unitPrice,
        totalPrice,
        internalUse,
        purchaseDepartment,
        deliveryTerm,
        leadTime,
        taxValue,
        exwork,
        prCount, // Insert prCount
        lastSubmissionDate, // Insert lastSubmissionDate into the database
      ]
    );

    await db.query("COMMIT"); // Commit the transaction

    // Update prCount and lastSubmissionDate in the database
    await db.query(
      "UPDATE purchase_request SET pr_count = $1, last_submission_date = $2 WHERE user_id = $3",
      [prCount, lastSubmissionDate, req.session.user.id]
    );

    // Fetch the user's first name and last name again from the database
    const userQuery = await db.query(
      "SELECT first_name, last_name FROM users WHERE id = $1",
      [req.session.user.id]
    );

    // Extract user details and pr_count from the query result
    const { first_name, last_name } = userQuery.rows[0];

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

    // console.log("prCount:", prCount);
    // console.log("lastSubmissionDate:", lastSubmissionDate);
    // console.log("getFormattedDate():", getFormattedDate());

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
