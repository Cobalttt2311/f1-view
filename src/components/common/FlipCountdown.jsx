import React, { useEffect, useRef, useState } from "react";

function FlipUnit({ label, value }) {
  const formatted = String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  const prevValueRef = useRef(formatted);
  const [flapState, setFlapState] = useState({
    curr: formatted,
    prev: formatted,
    flipKey: 0,
  });

  useEffect(() => {
    if (prevValueRef.current !== formatted) {
      const prev = prevValueRef.current;
      prevValueRef.current = formatted;
      setFlapState((s) => ({
        curr: formatted,
        prev,
        flipKey: s.flipKey + 1,
      }));
    }
  }, [formatted]);

  const { curr, prev, flipKey } = flapState;

  return (
    <div className="f1-flip-unit">
      <span className="f1-flip-label">{label}</span>
      <div className="f1-flip-card">
        {/* Static Top (new value) & Static Bottom (old value while folding) */}
        <div className="f1-flip-static f1-flip-static-top">
          <span>{curr}</span>
        </div>
        <div className="f1-flip-static f1-flip-static-bottom">
          <span>{prev}</span>
        </div>

        {/* Animated 3D Split-Flap Leaves */}
        {flipKey > 0 && (
          <div key={flipKey} className="f1-flip-anim-layer" aria-hidden="true">
            <div className="f1-flip-leaf f1-flip-leaf-top">
              <span>{prev}</span>
            </div>
            <div className="f1-flip-leaf f1-flip-leaf-bottom">
              <span>{curr}</span>
            </div>
          </div>
        )}

        <span className="f1-flip-crease" aria-hidden="true" />
        <span className="f1-flip-hinge f1-flip-hinge-left" aria-hidden="true" />
        <span className="f1-flip-hinge f1-flip-hinge-right" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function FlipCountdown({
  days = 0,
  hours = 0,
  mins = 0,
  secs = 0,
}) {
  return (
    <div className="f1-flip-countdown">
      <FlipUnit label="DAYS" value={days} />
      <span className="f1-flip-colon" aria-hidden="true">
        <i />
        <i />
      </span>
      <FlipUnit label="HRS" value={hours} />
      <span className="f1-flip-colon" aria-hidden="true">
        <i />
        <i />
      </span>
      <FlipUnit label="MIN" value={mins} />
      <span className="f1-flip-colon" aria-hidden="true">
        <i />
        <i />
      </span>
      <FlipUnit label="SEC" value={secs} />
    </div>
  );
}
