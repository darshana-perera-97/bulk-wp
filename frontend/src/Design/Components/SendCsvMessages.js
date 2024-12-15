import React, { useState } from "react";

function SendCsvMessages() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !message) {
      setResponseMessage("Please provide a message and select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", message);

    try {
      const response = await fetch("http://localhost:3001/csvMessages", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResponseMessage(data.message);
      } else {
        const error = await response.json();
        setResponseMessage(error.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while sending messages.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Send Messages from CSV</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Message:</label>
          <textarea
            rows="4"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div>
          <label>Upload CSV File:</label>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <button type="submit">Send Messages</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
}

export default SendCsvMessages;
