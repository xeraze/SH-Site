import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/base.css";
import App from "./App.tsx";

const deepParams = new URLSearchParams(window.location.search);
const deepPath = deepParams.get("p");
if (deepPath && deepPath.startsWith("/") && !deepPath.startsWith("//")) {
  const deepQuery = deepParams.get("q");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  window.history.replaceState(
    null,
    "",
    `${base}${deepPath}${deepQuery ? `?${deepQuery}` : ""}${window.location.hash}`,
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/SH-Site">
      <App />
    </BrowserRouter>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .catch(() => {});
}
