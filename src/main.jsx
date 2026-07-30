import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./store/AppStore";

import "./styles/terminal.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BASE_URL is "/" in dev and the repo path on Pages, so the router's
        links and the built asset paths always agree. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
