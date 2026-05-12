import React from "react";
import { createRoot } from "react-dom/client";
import ExtensionApp from "./ExtensionApp";
import "./popup.css";

createRoot(document.getElementById("root")).render(<ExtensionApp />);
