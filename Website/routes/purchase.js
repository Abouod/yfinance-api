import express from "express";
import { db } from "../config.js";
import requireSignin from "./authMiddleware.js"; // Import the middleware function

const router = express.Router();

// Function to get today's date in the desired format (DDMMYY)
function getFormattedDate() {
  const today = new Date();
  return today
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "");
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

    // Split the fullName into firstName and lastName
    const [firstName, lastName] = fullName.split(" ");

    // Check if tax field is empty or undefined
    // If it is, set it to null or any other appropriate default value
    const taxValue = tax !== undefined && tax !== "" ? tax : null; //! Can be adjusted to whatever makes sense in this case (Just to prevent pg insertion error)
    // Get the formatted date
    // Get the formatted date (DDMMYY)
    const formattedDate = getFormattedDate();

    // Get the last submission date from the session
    const lastSubmissionDate = req.session.lastSubmissionDate || formattedDate;

    // Reset prCount to 1 if the last submission date is different from the current date
    const currentDate = formattedDate;

    if (lastSubmissionDate !== currentDate) {
      // Reset prCount to 1
      req.session.prCount = 1;
      req.session.lastSubmissionDate = currentDate;
    }

    // Increment prCount for each submission
    req.session.prCount = req.session.prCount ? req.session.prCount + 1 : 1;

    // Generate requisitionNo by concatenating PR prefix, user initials, formatted date, and PR count
    const requisitionNo = `PR${firstName.charAt(0)}${lastName.charAt(
      0
    )}-${formattedDate}${req.session.prCount.toString().padStart(3, "0")}`;

    // Insert data into the purchase_request table
    await db.query(
      `INSERT INTO purchase_request (user_id, request_by, request_date, customer_name, requisition_no, online_purchase, quotation_no, pr_type, project_category, type_for_purchase, customer_po, supplier_name, project_description, supplier_type, item, description, part_no, brand, date_required, quantity, currency, unit_price, total_price, internal_use, purchase_department, delivery_term, lead_time, tax, exwork, pr_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
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
        req.session.prCount, // Insert prCount into the database
      ]
    );
    await db.query("COMMIT"); // Commit the transaction

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

    // Get the last submission date and prCount from the session
    const lastSubmissionDate =
      req.session.lastSubmissionDate || getFormattedDate();

    // Define currentDate
    const currentDate = getFormattedDate();

    const prCount =
      lastSubmissionDate === currentDate ? req.session.prCount || 1 : 1;

    // Update session variables
    req.session.lastSubmissionDate = currentDate;
    req.session.prCount = prCount;

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
    )}-${lastSubmissionDate}${prCount.toString().padStart(3, "0")}`;

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
