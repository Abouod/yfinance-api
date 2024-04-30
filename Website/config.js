// config.js
import pg from "pg";
import session from "express-session";
import nodemailer from "nodemailer";
import env from "dotenv";
import express from "express";

const app = express();
env.config(); //Load environment variables from .env file

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// Configure express-session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Set a secret key for session encryption
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //Cookie to maintain session activity for a day 1000 miliseconds (1 second) x 60 x 60 minutes * 24 hours
    },
  })
);

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST, // Specify the SMTP host
  port: process.env.MAILER_PORT, // Specify the SMTP port
  secure: false, // Set to true if using SSL/TLS (Should be kept to false if using sophic email for that is not supported)
  auth: {
    user: process.env.USER_EMAIL, // SMTP username
    pass: process.env.USER_PASS, // SMTP password
  },
  debug: true, // Enable debugging
  // tls: {
  //   rejectUnauthorized: true, // (false) Accept self-signed certificates without rejecting the connection
  // },
});

export { db, transporter, app };
