// src/socket.js
import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
// TEMP: Disable socket.io to prevent error spam
const socket = { on: () => { }, off: () => { } };

export default socket;
