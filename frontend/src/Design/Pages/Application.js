import React, { useState, useEffect } from "react";
import SendCsvMessages from "../Components/SendCsvMessages";
import Timer from "../Components/Timer";
import QRCodeComponent from "../Components/QRCodeComponent";

function Application() {
  const [otpInput, setOtpInput] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState(""); // State to store QR code URL
  const [phoneNumber, setPhoneNumber] = useState(""); // State for phone number input
  const [message, setMessage] = useState(""); // State for message input
  const [sendMessageResponse, setSendMessageResponse] = useState(""); // State for send message response
  const [isConnected, setIsConnected] = useState(false); // Track connection status

  // Fetch the connection status and QR code periodically
  useEffect(() => {
    const fetchStatusAndQrCode = async () => {
      try {
        // Fetch connection status
        const statusResponse = await fetch(
          "http://localhost:3001/connectionStatus"
        );
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIsConnected(statusData.connected);
        }

        // Fetch QR code if not connected
        if (!isConnected) {
          const qrResponse = await fetch("http://localhost:3001/qrCode");
          if (qrResponse.ok) {
            const html = await qrResponse.text();
            const imageUrl = html.match(/src="(.*?)"/)?.[1]; // Extract image URL
            setQrCodeUrl(imageUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching status or QR code:", error);
      }
    };

    const intervalId = setInterval(fetchStatusAndQrCode, 1000);
    return () => clearInterval(intervalId);
  }, [isConnected]);

  // Function to handle OTP submission
  const handleOtpSubmit = async (e) => {
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

  // Function to handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, message }),
      });

      if (response.ok) {
        const data = await response.json();
        setSendMessageResponse(data.message); // Display success message
      } else {
        const error = await response.json();
        setSendMessageResponse(error.message); // Display error message
      }
    } catch (error) {
      console.error("Error:", error);
      setSendMessageResponse("An error occurred while sending the message.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>WhatsApp Connection Status</h2>

      {/* Show connection status */}
      {isConnected ? (
        <p style={{ color: "green" }}>Device is connected.</p>
      ) : (
        qrCodeUrl && (
          <div>
            <p style={{ color: "red" }}>
              Device is not connected. Scan the QR code below:
            </p>
            <img src={qrCodeUrl} alt="QR Code" style={{ width: "200px" }} />
          </div>
        )
      )}

      <h2>Validate OTP</h2>
      <form onSubmit={handleOtpSubmit}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
        />
        <button type="submit">Check OTP</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}

      <h2>Send Message via WhatsApp</h2>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Enter phone number (with country code)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <textarea
          placeholder="Enter message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send Message</button>
      </form>
      {sendMessageResponse && <p>{sendMessageResponse}</p>}
      <SendCsvMessages />
      <Timer />
      <QRCodeComponent />
    </div>
  );
}

export default Application;
