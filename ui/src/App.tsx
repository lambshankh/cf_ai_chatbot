import { useEffect, useRef, useState } from "react";
import { MemoryPanel } from "./components/MemoryPanel";
import { ChatBubble } from "./components/ChatBubble";

function App() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

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
        alignItems: "center"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 20,
          height: "85vh",
          width: "95%",
          maxWidth: 1000
        }}
      >
        {/* LEFT: chat */}
        <div
          style={{
            flex: 1,
            background: "#1a1a1a",
            borderRadius: 12,
            padding: 20,
            color: "white",
            border: "1px solid #2c2c2c",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 0 12px rgba(0,0,0,0.35)"
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 10, fontWeight: 600 }}>
            CF AI Chatbot
          </h2>

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

        {/* RIGHT: memory panel */}
        <MemoryPanel />
      </div>
    </div>
  );
}

export default App;
