import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const instance = new ComlinkWorker(new URL("./data.ts", import.meta.url));
console.log(await instance.getData("/class_complete.csv"));
