const Ring = ({ size = 36, color = "#075985" }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      borderTop: `3px solid ${color}`,
      borderRight: "3px solid transparent",
      borderBottom: "3px solid transparent",
      borderLeft: "3px solid transparent",
      animation: "spin 0.9s linear infinite",
    }}
  />
);

const SectionSkeleton = ({ title = "Loading", image = true }) => {
  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16 }}
    >
      {image && (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(226,232,240,0.8), rgba(241,245,249,0.8))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ring />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 14,
            width: "40%",
            backgroundColor: "#e2e8f0",
            borderRadius: 999,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 10,
            width: "70%",
            backgroundColor: "#eef2f7",
            borderRadius: 999,
          }}
        />
        <div style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>
          {title}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default SectionSkeleton;
