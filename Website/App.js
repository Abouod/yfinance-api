import express from "express";
import bodyParser from "body-parser";
import authentication from "./routes/authentication.js";
import profile from "./routes/profile.js";
import purchase from "./routes/purchase.js";
import index from "./routes/index.js";
import verify from "./routes/verify.js";
import { app } from "./config.js";

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // for parsing application/json
app.use(express.static("public"));

// Route to serve the signin.ejs file
app.get("/", (req, res) => {
  // Pass an empty string as the error message initially
  res.render("signin.ejs", {
    errorMessage: "",
  });
});

// Route to serve the signup.ejs file
app.get("/signup", (req, res) => {
  // Pass an empty string as the error message initially
  res.render("signup.ejs", {
    errorMessage: "",
  });
});

// Routes
app.use("/index", index);
app.use("/auth", authentication);
app.use("/userProfile", profile);
app.use("/purchase", purchase);
app.use("/verify", verify);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
