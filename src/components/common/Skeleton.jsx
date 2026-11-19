import React from "react";

export function SkeletonBox({
  width = "100%",
  height = 14,
  borderRadius = 6,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`f1-skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function TableRowsSkeleton({ rows = 6, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="f1-skeleton-tr" aria-hidden="true">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <td key={cIdx}>
              <SkeletonBox
                width={
                  cIdx === 0
                    ? "42%"
                    : cIdx === cols - 1
                      ? "56%"
                      : `${60 + ((rIdx + cIdx) % 3) * 12}%`
                }
                height={13}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TablePanelSkeleton({ rows = 7, cols = 4 }) {
  return (
    <div className="table-responsive" aria-hidden="true">
      <table className="f1-minimal-table">
        <tbody>
          <TableRowsSkeleton rows={rows} cols={cols} />
        </tbody>
      </table>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  gridClass = "f1-drivers-editorial-grid",
  cardHeight = 156,
}) {
  return (
    <div className={gridClass} aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="f1-skeleton-card"
          style={{ minHeight: cardHeight }}
        >
          <div className="f1-skeleton-card-top">
            <SkeletonBox width="38%" height={12} />
            <SkeletonBox width={36} height={36} borderRadius="50%" />
          </div>
          <SkeletonBox width="68%" height={20} style={{ marginTop: 14 }} />
          <SkeletonBox width="45%" height={12} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="f1-skeleton-chart-wrap" aria-hidden="true">
      <div className="f1-chart-legend-grid">
        {Array.from({ length: 12 }).map((_, idx) => (
          <SkeletonBox key={idx} width="100%" height={30} borderRadius={6} />
        ))}
      </div>
      <SkeletonBox width="100%" height={380} borderRadius={10} />
    </div>
  );
}

export function ProfileModalSkeleton() {
  return (
    <div className="driver-profile-modal-content" aria-hidden="true">
      <div className="profile-modal-hero">
        <div className="profile-modal-info" style={{ flex: 1 }}>
          <SkeletonBox width="58%" height={26} />
          <SkeletonBox width="32%" height={14} style={{ marginTop: 10 }} />
          <SkeletonBox width="48%" height={13} style={{ marginTop: 10 }} />
        </div>
        <SkeletonBox width={82} height={82} borderRadius="50%" />
      </div>
      <div className="driver-stat-section">
        <div className="driver-stat-pair-grid">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="driver-stat-cell">
              <SkeletonBox width="55%" height={11} />
              <SkeletonBox width="40%" height={22} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarSplitSkeleton() {
  return (
    <div className="f1-calendar-split-layout" aria-hidden="true">
      <div className="cal-split-left">
        <div className="cal-list-scroll" style={{ padding: 12, gap: 10, display: "flex", flexDirection: "column" }}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <SkeletonBox key={idx} width="100%" height={74} borderRadius={10} />
          ))}
        </div>
      </div>
      <div className="cal-split-right" style={{ padding: 24 }}>
        <SkeletonBox width="62%" height={28} />
        <SkeletonBox width="40%" height={14} style={{ marginTop: 10, marginBottom: 24 }} />
        {Array.from({ length: 5 }).map((_, idx) => (
          <SkeletonBox
            key={idx}
            width="100%"
            height={48}
            borderRadius={8}
            style={{ marginBottom: 10 }}
          />
        ))}
      </div>
    </div>
  );
}
