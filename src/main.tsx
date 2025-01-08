import React from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";

console.debug(import.meta.env);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
