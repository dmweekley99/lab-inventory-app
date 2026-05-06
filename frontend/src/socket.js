// src/socket.js
import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const socket = io(URL, { autoConnect: true });

export default socket;
