import React, { createContext, useContext, useState } from "react";

const TimezoneContext = createContext();

export function TimezoneProvider({ children }) {
  const [timezone, setTimezone] = useState("WIB"); // 'WIB' atau 'UTC'

  const formatSessionTime = (utcTimeStr, wibTimeStr) => {
    if (timezone === "UTC") return utcTimeStr || "-";
    return wibTimeStr || "-";
  };

  return (
    <TimezoneContext.Provider
      value={{ timezone, setTimezone, formatSessionTime }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export const useTimezone = () => useContext(TimezoneContext);
