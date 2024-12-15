import React, { useState, useEffect } from "react";

const QRCodeComponent = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let intervalId;

    const fetchQRCode = async () => {
      try {
        const response = await fetch("http://localhost:3001/qrCode");
        if (response.ok) {
          const qrCodeHTML = await response.text();
          setQrCodeUrl(qrCodeHTML); // Update with QR code HTML
          setErrorMessage(""); // Clear any previous error message
        } else {
          setErrorMessage("QR Code not available yet. Try again later.");
        }
      } catch (error) {
        console.error("Error fetching QR Code:", error);
        setErrorMessage("Failed to fetch QR Code.");
      }
    };

    // Call the function every 1 second
    intervalId = setInterval(fetchQRCode, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h3>WhatsApp QR Code</h3>
      {qrCodeUrl ? (
        // Render the QR Code HTML as received from the server
        <div dangerouslySetInnerHTML={{ __html: qrCodeUrl }} />
      ) : (
        <p>{errorMessage || "Loading QR Code..."}</p>
      )}
    </div>
  );
};

export default QRCodeComponent;
