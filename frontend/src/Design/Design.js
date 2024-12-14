import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Form from "./Pages/Form";
import Application from "./Pages/Application";

export default function Design() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<Form />} />
        <Route path="/application" element={<Application />} />
      </Routes>
    </Router>
  );
}
