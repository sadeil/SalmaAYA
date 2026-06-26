import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "../styles/index.css";
import { AutoTranslate, LanguageProvider } from "../i18n/LanguageContext";

const Router = import.meta.env.VITE_STATIC_DEMO === "true" ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <LanguageProvider>
        <AutoTranslate />
        <App />
      </LanguageProvider>
    </Router>
  </React.StrictMode>
);
