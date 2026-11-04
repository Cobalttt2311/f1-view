import React, { createContext, useContext, useState } from "react";

const SeasonContext = createContext();

export function SeasonProvider({ children }) {
  const [season, setSeason] = useState(2026);

  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export const useSeason = () => useContext(SeasonContext);
