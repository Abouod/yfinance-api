// Middleware function to check if user is authenticated
function requireSignin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    next(); // Continue to the next middleware or route handler
  }
}

export default requireSignin;
