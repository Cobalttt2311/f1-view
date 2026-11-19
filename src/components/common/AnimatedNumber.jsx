import React, { useEffect, useState } from "react";

export default function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 650,
}) {
  const numericTarget = Number(value);
  const isValidNumber =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !Number.isNaN(numericTarget) &&
    Number.isFinite(numericTarget);

  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (!isValidNumber) return;
    if (numericTarget === 0) {
      setDisplayVal(0);
      return;
    }

    let rafId = null;
    let startTime = null;
    const hasDecimal = !Number.isInteger(numericTarget);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numericTarget * eased;

      if (progress >= 1) {
        setDisplayVal(numericTarget);
        return;
      }

      setDisplayVal(
        hasDecimal ? Number(current.toFixed(1)) : Math.round(current)
      );
      rafId = requestAnimationFrame(step);
    };

    setDisplayVal(0);
    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [numericTarget, isValidNumber, duration]);

  if (!isValidNumber) {
    return (
      <>
        {prefix}
        {value ?? "-"}
        {suffix}
      </>
    );
  }

  return (
    <>
      {prefix}
      {displayVal}
      {suffix}
    </>
  );
}
