import DashboardLayout from "@/components/DashboardLayout";

export default function SkeletonInformation() {
  return (
    <DashboardLayout>
      <style>{`
        @keyframes sk-shimmer {
          0%   { background-position: -700px 0; }
          100% { background-position:  700px 0; }
        }
        .sk {
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.03) 0%,
            rgba(255,255,255,0.07) 45%,
            rgba(255,255,255,0.03) 80%
          );
          background-size: 700px 100%;
          animation: sk-shimmer 1.5s ease-in-out infinite;
        }
        .sk-panel {
          background: #0D1210;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sk" style={{ height: 22, width: 180 }} />
            <div className="sk" style={{ height: 12, width: 120 }} />
          </div>
          <div className="sk" style={{ height: 36, width: 130, borderRadius: 9 }} />
        </div>

        {/* ── STAT STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sk-panel" style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="sk" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="sk" style={{ height: 9, width: "60%" }} />
                <div className="sk" style={{ height: 16, width: "40%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="sk" style={{ height: 36, flex: 1, borderRadius: 8 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 36, width: 100, borderRadius: 8 }} />
          ))}
        </div>

        {/* ── TABLE ── */}
        <div className="sk-panel" style={{ overflow: "hidden" }}>

          {/* table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
            padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            gap: 16,
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sk" style={{ height: 9, width: i === 0 ? "60%" : "50%" }} />
            ))}
          </div>

          {/* table rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
              padding: "14px 20px", gap: 16,
              borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none",
              alignItems: "center",
            }}>
              {/* client cell */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="sk" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div className="sk" style={{ height: 10, width: 110 }} />
                  <div className="sk" style={{ height: 8, width: 80 }} />
                </div>
              </div>
              {/* remaining cells */}
              <div className="sk" style={{ height: 20, width: 72, borderRadius: 20 }} />
              <div className="sk" style={{ height: 10, width: 64 }} />
              <div className="sk" style={{ height: 10, width: 72 }} />
              <div className="sk" style={{ height: 20, width: 80, borderRadius: 20 }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <div className="sk" style={{ height: 28, width: 88, borderRadius: 7 }} />
                <div className="sk" style={{ height: 28, width: 32, borderRadius: 7 }} />
              </div>
            </div>
          ))}

          {/* pagination */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div className="sk" style={{ height: 9, width: 100 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <div className="sk" style={{ height: 28, width: 72, borderRadius: 7 }} />
              <div className="sk" style={{ height: 28, width: 72, borderRadius: 7 }} />
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
