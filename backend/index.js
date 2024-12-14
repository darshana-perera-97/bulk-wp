const express = require("express");
const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Example API route to receive data
app.post("/api/data", (req, res) => {
  const data = req.body;
  res.send({ message: "Data received!", data });
});

// API to generate a random 6-digit OTP
app.get("/otp", (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit number
  res.send({ otp });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
