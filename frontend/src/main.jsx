import process from 'process';
window.process = process;


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";


createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<AuthContextProvider>
				<SocketContextProvider>
					<App />
				</SocketContextProvider>
			</AuthContextProvider>
		</BrowserRouter>
	</StrictMode>
);