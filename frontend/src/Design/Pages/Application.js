import React, { useState, useEffect } from "react";

function Application() {
  const [otpInput, setOtpInput] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState(""); // State to store QR code URL

  // Fetch the QR code every second
  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const response = await fetch("http://localhost:3001/qrCode");
        if (response.ok) {
          const html = await response.text();
          const imageUrl = html.match(/src="(.*?)"/)[1]; // Extract image URL from the HTML
          setQrCodeUrl(imageUrl);
        } else {
          console.error("Failed to fetch QR code.");
        }
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    };

    // Fetch QR code immediately and then every 1 second
    fetchQrCode();
    const intervalId = setInterval(fetchQrCode, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Function to handle OTP submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/checkOTP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: parseInt(otpInput) }), // Send OTP as number
      });

      if (response.ok) {
        const data = await response.json();
        setResponseMessage(data.message); // Display success message
      } else {
        const error = await response.json();
        setResponseMessage(error.message); // Display error message
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while validating the OTP.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Validate OTP</h2>

      {/* Show QR code if available */}
      {qrCodeUrl && (
        <div>
          <img src={qrCodeUrl} alt="QR Code" style={{ width: "200px" }} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
        />
        <button type="submit">Check OTP</button>
      </form>

      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
}

export default Application;
