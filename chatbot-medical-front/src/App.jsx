import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatBot from "./pages/ChatBot";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import PrivateRoute from "./components/PrivateRoute";


function App() {
  return (
    <Router>
      <Routes>
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <ChatBot />
          </PrivateRoute>
        }
      />        *
      <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
