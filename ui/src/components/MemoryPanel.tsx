import { useEffect, useState } from "react";

export function MemoryPanel() {
  const [facts, setFacts] = useState<{ key: string; value: string }[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  // --- FIXED: correct backend base URL ---
  const API_BASE = import.meta.env.DEV
    ? "/api"
    : "https://chatbot.shankhisinha1005.workers.dev/api";

  async function loadFacts() {
    const res = await fetch(`${API_BASE}/facts`, {
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    setFacts(data);
  }

  async function addFact() {
    if (!newKey.trim() || !newValue.trim()) return;

    await fetch(`${API_BASE}/facts/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: newKey.trim(),
        value: newValue.trim()
      })
    });

    setNewKey("");
    setNewValue("");
    loadFacts();
  }

  async function deleteFact(key: string) {
    await fetch(`${API_BASE}/facts/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key })
    });

    loadFacts();
  }

  useEffect(() => {
    loadFacts();
  }, []);

  return (
    <div
      style={{
        width: 300,
        background: "#141414",
        borderRadius: 12,
        padding: 20,
        paddingBottom: 32,
        color: "white",
        border: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        height: "92%",
        boxShadow: "0 0 12px rgba(0,0,0,0.4)",
        position: "relative"
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: "1px solid #222"
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>User Facts</div>

        <button
          onClick={() => setInfoOpen(!infoOpen)}
          style={{
            background: "transparent",
            border: "1px solid #555",
            width: 26,
            height: 26,
            borderRadius: "50%",
            color: "#ddd",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: "6px",
          }}
        >
          ?
        </button>
      </div>

      {/* INFO POPUP */}
      {infoOpen && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 16,
            width: 250,
            background: "#1d1d1d",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #333",
            boxShadow: "0 0 10px rgba(0,0,0,0.6)",
            fontSize: 13,
            zIndex: 99
          }}
        >
          <strong>How to use User Facts:</strong>
          <ul style={{ paddingLeft: 16, marginTop: 6 }}>
            <li><b>Fact name</b> is the label (e.g., name, job, city).</li>
            <li><b>Fact value</b> is the actual info.</li>
            <li>The AI always sees these facts.</li>
            <li>The AI can’t modify them.</li>
          </ul>
        </div>
      )}

      {/* FACT LIST */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: 4,
          marginBottom: 12
        }}
      >
        {facts.length === 0 && (
          <div
            style={{
              color: "#aaa",
              fontSize: 14,
              textAlign: "center",
              marginTop: 20
            }}
          >
            No saved facts yet.
          </div>
        )}

        {facts.map((f) => (
          <div
            key={f.key}
            style={{
              marginBottom: 10,
              padding: "10px 12px",
              background: "#1b1b1b",
              borderRadius: 8,
              border: "1px solid #2d2d2d",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{f.key}</div>
              <div style={{ fontSize: 13, color: "#ccc" }}>{f.value}</div>
            </div>

            <button
              onClick={() => deleteFact(f.key)}
              style={{
                background: "#ff3b3b",
                border: "none",
                borderRadius: 6,
                padding: "4px 8px",
                color: "white",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* INPUTS */}
      <input
        value={newKey}
        onChange={(e) => setNewKey(e.target.value)}
        placeholder="Fact name"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 10,
          marginBottom: 8,
          borderRadius: 6,
          border: "1px solid #333",
          background: "#222",
          color: "white",
          fontSize: 14
        }}
      />

      <input
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        placeholder="Fact value"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 10,
          marginBottom: 8,
          borderRadius: 6,
          border: "1px solid #333",
          background: "#222",
          color: "white",
          fontSize: 14
        }}
      />

      <button
        onClick={addFact}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 6,
          background: "#007bff",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
        }}
      >
        Add
      </button>
    </div>
  );
}
