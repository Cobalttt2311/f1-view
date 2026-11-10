import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { SeasonProvider } from "./context/SeasonContext";
import { TimezoneProvider } from "./context/TimezoneContext";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // Cache data selama 10 menit
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SeasonProvider>
          <TimezoneProvider>
            <App />
          </TimezoneProvider>
        </SeasonProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
