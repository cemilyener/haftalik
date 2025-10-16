// client/src/main.jsx
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ❌ Burada BrowserRouter OLMAYACAK
createRoot(document.getElementById("root")).render(
  <App />
);
