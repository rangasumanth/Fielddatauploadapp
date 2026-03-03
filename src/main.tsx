
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Diagnostic logging
console.log("App initializing...");
window.addEventListener('error', (event) => {
  console.error("Global runtime error:", event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error("Unhandle promise rejection:", event.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");
  createRoot(rootElement).render(<App />);
  console.log("React app rendered to DOM");
} catch (err) {
  console.error("Failed to render app:", err);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Fatal App Error: ${err}</div>`;
}
