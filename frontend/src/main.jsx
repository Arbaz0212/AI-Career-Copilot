import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <Toaster
  position="top-center"
  containerStyle={{
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 99999,
    }}
  toastOptions={{
    duration: 3000,
    }}
    />
  </StrictMode>
);