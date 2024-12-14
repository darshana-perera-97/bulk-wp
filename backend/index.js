const express = require("express");
const fs = require("fs");
const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());

// File to store OTPs
const OTP_FILE = "./otp_data.json";

// Function to read and update the OTP file
const saveOtpToFile = (otp) => {
  let otpArray = [];
  if (fs.existsSync(OTP_FILE)) {
    const data = fs.readFileSync(OTP_FILE, "utf-8");
    otpArray = JSON.parse(data); // Read existing OTPs
  }
  otpArray.push(otp); // Add the new OTP
  fs.writeFileSync(OTP_FILE, JSON.stringify(otpArray, null, 2)); // Save back to the file
};

// Basic route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Example API route to receive data
app.post("/api/data", (req, res) => {
  const data = req.body;
  res.send({ message: "Data received!", data });
});

// API to generate and store a random 6-digit OTP
app.get("/otp", (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit number
  saveOtpToFile(otp); // Save OTP to file
  res.send({ otp, message: "OTP generated and saved!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
