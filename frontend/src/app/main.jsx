import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "../styles/index.css";
import { AutoTranslate, LanguageProvider } from "../i18n/LanguageContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AutoTranslate />
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
