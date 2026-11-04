import { useState, useMemo } from "react";

export function useTableSort(data = [], defaultKey = null, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const requestSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !Array.isArray(data) || data.length === 0) return data;

    return [...data].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      // Special handling for position strings like "P1", "PL", "Stop 1"
      const strA = String(valA).trim();
      const strB = String(valB).trim();

      if (strA === "PL") return sortDir === "asc" ? 1 : -1;
      if (strB === "PL") return sortDir === "asc" ? -1 : 1;

      const numA = typeof valA === "number" ? valA : parseFloat(strA.replace(/[^0-9.-]+/g, ""));
      const numB = typeof valB === "number" ? valB : parseFloat(strB.replace(/[^0-9.-]+/g, ""));

      let res = 0;
      if (!isNaN(numA) && !isNaN(numB) && /\d/.test(strA) && /\d/.test(strB)) {
        res = numA - numB;
      } else {
        res = strA.localeCompare(strB);
      }

      return sortDir === "asc" ? res : -res;
    });
  }, [data, sortKey, sortDir]);

  return { sortedData, sortKey, sortDir, requestSort };
}

export default useTableSort;

