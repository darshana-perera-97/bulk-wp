const express = require("express");
const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Example API route
app.post("/api/data", (req, res) => {
  const data = req.body;
  res.send({ message: "Data received!", data });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
