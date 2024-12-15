const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const axios = require("axios");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer"); // Ensure multer is imported

// Express app setup
const app = express();
const port = 3001;

let isClientConnected = false;
let resetTimer; // Variable to hold the reset timer

const upload = multer({ dest: "uploads/" }); // Temporary folder for uploads

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// File to store OTPs
const OTP_FILE = "./otp_data.json";

// Variable to track when the reset was scheduled
const resetInterval = 1 * 60 * 1000; // 5 minutes in milliseconds
const resetScheduledTime = Date.now() + resetInterval;

// API to get the remaining time for the WhatsApp connection reset
app.get("/remainingTime", (req, res) => {
  const currentTime = Date.now();
  const remainingTime = resetScheduledTime - currentTime;

  if (remainingTime > 0) {
    res.send({ remainingTime: Math.floor(remainingTime / 1000) }); // Remaining time in seconds
  } else {
    res.send({ remainingTime: 0 }); // Reset time has passed
  }
});

// Schedule the reset
setTimeout(() => {
  resetWhatsAppClient(); // Reset the client for a new session
}, resetInterval);

// Disconnect the client after 5 minutes
setTimeout(() => {
  resetWhatsAppClient(); // Reset the client for a new session
}, 1 * 60 * 1000); // 5 minutes in milliseconds

const resetWhatsAppClient = () => {
  console.log("Resetting WhatsApp client...");

  const authFilePath = path.resolve(__dirname, ".wwebjs_auth");
  const cacheFilePath = path.resolve(__dirname, ".wwebjs_cache");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const renamedAuthFilePath = `${authFilePath}-${timestamp}`;
  const renamedCacheFilePath = `${cacheFilePath}-${timestamp}`;

  // Logout the client
  client
    .destroy()
    .then(() => {
      console.log("Client successfully logged out.");

      // Rename the auth and cache files
      fs.rename(authFilePath, renamedAuthFilePath, (authRenameErr) => {
        if (authRenameErr) {
          console.error("Error renaming the auth file:", authRenameErr);
        } else {
          console.log(`Auth file renamed to: ${renamedAuthFilePath}`);
        }

        fs.rename(cacheFilePath, renamedCacheFilePath, (cacheRenameErr) => {
          if (cacheRenameErr) {
            console.error("Error renaming the cache file:", cacheRenameErr);
          } else {
            console.log(`Cache file renamed to: ${renamedCacheFilePath}`);
          }

          // Reinitialize the client
          client
            .initialize()
            .then(() => {
              console.log("Client reinitialized for a new session.");
            })
            .catch((error) => {
              console.error("Error during client reinitialization:", error);
            });
        });
      });
    })
    .catch((error) => {
      console.error("Error during client logout:", error);
    });
};

// Function to read OTP data from the file
const readOtpFile = () => {
  if (fs.existsSync(OTP_FILE)) {
    const data = fs.readFileSync(OTP_FILE, "utf-8");
    return JSON.parse(data); // Parse and return the data as an array
  }
  return []; // Return an empty array if the file does not exist
};

// Function to write OTP data to the file
const writeOtpFile = (otpArray) => {
  fs.writeFileSync(OTP_FILE, JSON.stringify(otpArray, null, 2)); // Format JSON with 2 spaces indentation
};

// Function to save a new OTP
const saveOtpToFile = (otp) => {
  const otpArray = readOtpFile(); // Read existing OTPs
  otpArray.push(otp); // Add the new OTP
  writeOtpFile(otpArray); // Save back to the file
};

// API to generate and store a random 6-digit OTP
app.get("/otp", (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit number
  saveOtpToFile(otp); // Save OTP to file
  res.send({ otp, message: "OTP generated and saved!" });
});

// API to check and validate OTP
app.post("/checkOTP", (req, res) => {
  const { otp } = req.body; // Receive OTP from frontend
  const otpArray = readOtpFile(); // Read OTPs from file

  const otpIndex = otpArray.indexOf(otp); // Check if OTP exists
  if (otpIndex !== -1) {
    otpArray.splice(otpIndex, 1); // Remove OTP if found
    writeOtpFile(otpArray); // Save updated array
    res.send({ message: "OTP validated successfully!" });
  } else {
    res.status(400).send({ message: "Invalid OTP!" });
  }
});

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true, // Run in headless mode
    args: ["--no-sandbox"], // Required for some environments
    timeout: 60000, // Increase the timeout to 60 seconds
  },
});

// Generate and store the QR code in memory
client.on("qr", (qr) => {
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error("Error generating QR code:", err);
    } else {
      // Store the QR code URL in memory to serve later
      global.qrCodeUrl = url;
      console.log("QR code generated.");
    }
  });
});

// Log a message when successfully authenticated
client.on("ready", () => {
  isClientConnected = true;
  console.log("Client is ready!");

  // Clear any existing reset timer
  if (resetTimer) {
    clearTimeout(resetTimer);
  }

  // Schedule reset timer
  const resetInterval = 5 * 60 * 1000; // 5 minutes
  resetTimer = setTimeout(() => {
    resetWhatsAppClient();
  }, resetInterval);

  console.log(`WhatsApp client will reset in ${resetInterval / 1000} seconds.`);
});

client.on("disconnected", () => {
  isClientConnected = false;
  console.log("Client was logged out.");

  // Clear the reset timer when disconnected
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }
});

app.get("/connectionStatus", (req, res) => {
  res.send({ connected: isClientConnected });
});
// Error handling
client.on("error", (error) => {
  console.error("An error occurred:", error);
  // Optional: add logic to retry initialization or alert on persistent issues
});

// Listen for incoming messages
client.on("message", async (message) => {
  console.log(`Message received: ${message.body}`);

  // Convert the message to lowercase for easier keyword matching
  const lowerCaseMessage = message.body.toLowerCase();

  // Check for specific keywords and respond accordingly
  if (lowerCaseMessage === "hello") {
    message.reply("Hi there! How can I help you today?");
  } else if (lowerCaseMessage === "how are you?") {
    message.reply(
      "I'm just a bot, but I'm here to assist you! How can I help?"
    );
  } else if (lowerCaseMessage === "what's your name?") {
    message.reply("I'm your friendly WhatsApp bot. What's yours?");
  } else if (lowerCaseMessage === "bye") {
    message.reply("Goodbye! Feel free to message me anytime.");
  } else if (lowerCaseMessage.includes("help")) {
    message.reply(
      "Sure! Here's what I can do:\n- Say 'hello' to start a conversation.\n- Ask 'how are you?'\n- Ask 'what's your name?'\n- Say 'bye' to end the conversation.\n- Or type 'help' to see this message again."
    );
  } else if (lowerCaseMessage === "image") {
    // Fetch the image from the URL
    const url =
      "https://cdn.britannica.com/84/73184-050-05ED59CB/Sunflower-field-Fargo-North-Dakota.jpg";

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const media = new MessageMedia(
        "image/jpeg",
        response.data.toString("base64"),
        "sunflower.jpg"
      );
      await client.sendMessage(message.from, media);
    } catch (error) {
      console.error("Failed to send image:", error);
      message.reply(
        "Sorry, I couldn't retrieve the image. Please try again later."
      );
    }
  } else {
    // Default response if the message doesn't match any predefined keywords
    message.reply(
      "I'm not sure how to respond to that. You can type 'help' to see what I can do."
    );
  }
});

// Define the /csvMessages endpoint
app.post("/csvMessages", upload.single("file"), async (req, res) => {
  const filePath = req.file.path; // File path of the uploaded CSV
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ message: "Message is required." });
  }

  const phoneNumbers = [];

  // Parse the CSV file
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (row) => {
      if (row.phoneNumber) {
        const formattedPhoneNumber = `${row.phoneNumber.replace(
          /\D/g,
          ""
        )}@c.us`;
        phoneNumbers.push(formattedPhoneNumber);
      }
    })
    .on("end", async () => {
      fs.unlinkSync(filePath); // Remove the temporary file after processing

      try {
        const failedNumbers = [];
        for (const phoneNumber of phoneNumbers) {
          try {
            const chat = await client.getChatById(phoneNumber);
            await chat.sendMessage(message);
          } catch (error) {
            console.error(`Failed to send message to ${phoneNumber}:`, error);
            failedNumbers.push(phoneNumber);
          }
        }

        const resultMessage =
          failedNumbers.length === 0
            ? "Messages sent successfully to all numbers!"
            : `Some messages failed to send: ${failedNumbers.join(", ")}`;

        res.send({ message: resultMessage, failedNumbers });
      } catch (error) {
        console.error("Error processing the CSV file:", error);
        res.status(500).send({ message: "Failed to process CSV file." });
      }
    })
    .on("error", (error) => {
      console.error("Error reading the CSV file:", error);
      res.status(500).send({ message: "Error reading CSV file." });
    });
});
// Handle disconnection events
client.on("disconnected", (reason) => {
  console.log("Client was logged out:", reason);
  // Optional: Add reconnection logic here if necessary
});

// Start the client
client.initialize().catch((error) => {
  console.error("Failed to initialize client:", error);
  // Optional: retry logic or other error handling
});

// Serve the QR code via the /qrCode API
app.get("/qrCode", (req, res) => {
  if (global.qrCodeUrl) {
    res.send(`<img src="${global.qrCodeUrl}" alt="QR Code">`);
  } else {
    res.status(404).send("QR code not generated yet.");
  }
});

app.post("/sendMessage", async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res
      .status(400)
      .send({ message: "Phone number and message are required." });
  }

  try {
    // Ensure the phone number is in the correct format (remove spaces and "+" sign, add @c.us)
    const formattedPhoneNumber = `${phoneNumber.replace(/\D/g, "")}@c.us`;

    const chat = await client.getChatById(formattedPhoneNumber); // Get the chat by phone number
    await chat.sendMessage(message); // Send the message
    res.send({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send({ message: "Failed to send the message." });
  }
});

// Start the Express server
app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`)
);
