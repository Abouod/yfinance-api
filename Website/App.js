import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import logger from "morgan";
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
app.use(cookieParser());

// Logging HTTP requests
app.use(logger("dev"));

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
app.use("/auth", authentication);
app.use("/verify", verify);
app.use("/index", index);
app.use("/userProfile", profile);
app.use("/purchase", purchase);

// Error handler
app.use(function (err, req, res, next) {
  // Use http-errors to create an error object
  const error = createError(err.status || 500, err.message);

  // Set locals, only providing error in development
  res.locals.message = error.message;
  res.locals.error = req.app.get("env") === "development" ? error : {};

  // Render the error page
  res.status(error.status);
  res.render("error");
});

export default app;
