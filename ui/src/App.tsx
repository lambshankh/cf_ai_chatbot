import { useEffect, useRef, useState } from "react";
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

    // /memory command
    if (text === "/memory") {
      const res = await fetch("/api/memory?session=default");
      const data = await res.json();
      const reply =
        "Summary:\n" +
        (data.summary || "No summary yet.") +
        "\n\nPersistent memory:\n" +
        (data.persistent_memory.length
          ? data.persistent_memory.map((m: any) => `${m.key}: ${m.value}`).join("\n")
          : "None");

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      return;
    }

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#101010"
      }}
    >
      <div
        style={{
          padding: 20,
          maxWidth: 600,
          width: "90%",
          background: "#1b1b1b",
          borderRadius: 12,
          boxShadow: "0 0 35px rgba(0,0,0,0.7)",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #2c2c2c"
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 10,
            color: "#f2f2f2"
          }}
        >
          CF AI Chatbot
        </h2>

        <div
          ref={chatRef}
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #2c2c2c",
            padding: 12,
            borderRadius: 8,
            background: "#171717"
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
              padding: "10px",
              borderRadius: 6,
              border: "1px solid #2c2c2c",
              fontSize: "16px",
              background: "#222",
              color: "#fff"
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "10px 18px",
              borderRadius: 6,
              background: "#0078FF",
              border: "none",
              color: "white",
              cursor: "pointer"
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

}

export default App;
