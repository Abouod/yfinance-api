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

// Route to handle form submission and save data to the database
router.post("/", requireSignin, async (req, res) => {
  try {
    // Extract data from the request body
    const {
      request_by,
      request_date,
      customer_name,
      requisition_no,
      online_purchase,
      quotation_no,
      pr_type,
      project_category,
      type_for_purchase,
      customer_po,
      supplier_name,
      project_description,
      supplier_type,
      item,
      description,
      part_no,
      brand,
      date_required,
      quantity,
      currency,
      unit_price,
      total_price,
      internal_use,
      purchase_department,
      delivery_term,
      lead_time,
      tax,
      exwork,
    } = req.body;

    // Insert data into the purchase_request table
    await db.query(
      `INSERT INTO purchase_request (user_id, request_by, request_date, customer_name, requisition_no, online_purchase, quotation_no, pr_type, project_category, type_for_purchase, customer_po, supplier_name, project_description, supplier_type, item, description, part_no, brand, date_required, quantity, currency, unit_price, total_price, internal_use, purchase_department, delivery_term, lead_time, tax, exwork)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
      [
        req.session.user.id,
        request_by,
        request_date,
        customer_name,
        requisition_no,
        online_purchase,
        quotation_no,
        pr_type,
        project_category,
        type_for_purchase,
        customer_po,
        supplier_name,
        project_description,
        supplier_type,
        item,
        description,
        part_no,
        brand,
        date_required,
        quantity,
        currency,
        unit_price,
        total_price,
        internal_use,
        purchase_department,
        delivery_term,
        lead_time,
        tax,
        exwork,
      ]
    );

    // Redirect to a success page or any other desired route
    res.redirect("/success");
  } catch (error) {
    console.error("Error saving purchase request:", error);
    // Handle errors appropriately, such as rendering an error page
    res.status(500).render("errorPage.ejs", {
      errorMessage: "An error occurred while saving the purchase request",
    });
  }
});

router.get("/", requireSignin, async (req, res) => {
  try {
    // Get the user's ID from the session
    const userId = req.session.user.id;

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

    // Render the purchaseRequest.ejs template and pass the concatenated string
    res.render("purchaseRequest.ejs", {
      firstName: first_name,
      lastName: last_name,
      getFormattedDate: getFormattedDate, // Pass the function to the template
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("purchaseRequest.ejs", {
      errorMessage: "An error occurred while fetching user details",
    });
  }
});

export default router;
