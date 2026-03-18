import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 2500,
        style: {
          background: "#161616",
          color: "#e5e5e5",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        },
        success: {
          iconTheme: { primary: "#00ff9d", secondary: "#0a0a0a" },
        },
        error: {
          iconTheme: { primary: "#ff4d6d", secondary: "#0a0a0a" },
        },
      }}
    />
  </React.StrictMode>
);
