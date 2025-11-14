import { useEffect, useRef, useState } from "react";
import { MemoryPanel } from "./components/MemoryPanel";
import { ChatBubble } from "./components/ChatBubble";

function App() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  async function sendMessage() {
    if (!input.trim()) return;

    const text = input;
    setInput("");

    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    const res = await fetch("/api/chat?session=default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    const botMsg = { role: "assistant", content: data.reply };

    setMessages(prev => [...prev, botMsg]);
  }

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#101010",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 20,
          height: "85vh",
          width: "95%",
          maxWidth: 1000,
          transition: "all 0.3s ease"
        }}
      >
        {/* LEFT: Chat Box */}
        <div
          style={{
            flex: panelOpen ? 0.78 : 1,
            background: "#1a1a1a",
            borderRadius: 12,
            padding: 20,
            color: "white",
            border: "1px solid #2c2c2c",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            transition: "flex 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)"
          }}
        >
          {/* TOP BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 10,
              position: "relative"
            }}
          >
            <h2 style={{ margin: 0 }}>CF AI Chatbot</h2>

            {/* 3-DOT MENU BUTTON + TOOLTIP */}
            <div style={{ position: "absolute", right: 0, top: 0 }}>
              <div style={{ position: "relative" }}>
                {/* Tooltip */}
                <div
                  className="tooltip"
                  style={{
                    visibility: "hidden",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    background: "#222",
                    color: "white",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    position: "absolute",
                    right: "110%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  User Facts Panel
                </div>

                {/* Button */}
                <button
                  onMouseEnter={(e) => {
                    const tip = e.currentTarget.previousSibling as HTMLElement;
                    tip.style.visibility = "visible";
                    tip.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const tip = e.currentTarget.previousSibling as HTMLElement;
                    tip.style.visibility = "hidden";
                    tip.style.opacity = "0";
                  }}
                  onClick={() => setPanelOpen(!panelOpen)}
                  style={{
                    background: "transparent",
                    border: "1px solid #555",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    color: "#ddd",
                    cursor: "pointer",
                    fontSize: 20,
                    lineHeight: "26px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 0
                  }}
                >
                  ⋮
                </button>
              </div>
            </div>
          </div>

          {/* CHAT AREA */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: "auto",
              border: "1px solid #2c2c2c",
              background: "#171717",
              padding: "14px 12px",
              borderRadius: 10
            }}
          >
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role as any} content={m.content} />
            ))}
          </div>

          {/* INPUT + SEND */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 6,
                background: "#222",
                color: "white",
                border: "1px solid #444",
                fontSize: 15
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "12px 20px",
                borderRadius: 6,
                background: "#007bff",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* RIGHT: Memory Panel (only visible when open) */}
        {panelOpen && (
          <div style={{ height: "100%", display: "flex" }}>
            <MemoryPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
