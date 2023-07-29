const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
const session = require('express-session')

let users = [];

const authenticatedUser = (username,password)=>{
  const matchedUsers = users.filter(
    user => user.username === username && user.password === password
  )
  return matchedUsers.length > 0
}


const isValid = (username)=>{ 
  const matchedUsers = users.filter(user => user.username === username)
  return matchedUsers.length > 0
}




//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken,username
  }
  return res.status(200).send("User successfully logged in");
  
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});



// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  console.log('in the review path');

  const isbn = req.params.isbn;
  const reviewText = req.query.review; // Get the review from the query parameter
  const username = req.session.authorization?.username; // Get the logged-in username from the session

  if (!reviewText || !username) {
    return res.status(400).json({ message: "Invalid request. Please provide a review and ensure you are logged in." });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  // Check if the user has already posted a review for the same ISBN
  if (!books[isbn].reviews[username]) {
    // If the user has not posted a review, add a new review
    books[isbn].reviews[username] = reviewText;
    return res.status(200).json({ message: "Review added successfully." });
  } else {
    // If the user has already posted a review, modify the existing review
    books[isbn].reviews[username] = reviewText;
    return res.status(200).json({ message: "Review modified successfully." });
  }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization?.username; // Get the logged-in username from the session

  if (!username) {
    return res.status(401).json({ message: "Unauthorized. Please log in to delete your review." });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  // Check if the user has posted a review for the same ISBN
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: "Review not found." });
  }

  // If the user has posted a review, delete it
  delete books[isbn].reviews[username];
  return res.status(200).json({ message: "Review deleted successfully." });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
