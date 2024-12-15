import React, { useState, useEffect } from "react";

const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(0); // Remaining time in seconds

  useEffect(() => {
    const fetchRemainingTime = async () => {
      try {
        const response = await fetch("http://localhost:3001/remainingTime");
        if (!response.ok) {
          throw new Error("Failed to fetch remaining time.");
        }
        const data = await response.json();
        setTimeLeft(data.remainingTime);
      } catch (error) {
        console.error("Error fetching remaining time:", error);
      }
    };

    // Fetch remaining time initially
    fetchRemainingTime();

    // Poll every second to update the timer
    const interval = setInterval(() => {
      fetchRemainingTime();
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Format the time as mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div>
      <h3>Remaining Time to Disconnect</h3>
      <p>{timeLeft > 0 ? formatTime(timeLeft) : "Disconnected"}</p>
    </div>
  );
};

export default Timer;
