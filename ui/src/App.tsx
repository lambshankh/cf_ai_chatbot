import { useState } from "react";

function App() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);

    const res = await fetch("/api/chat?session=default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    const botMsg = { role: "assistant", content: data.reply };

    setMessages(prev => [...prev, botMsg]);
    setInput("");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>CF AI Chatbot</h1>

      <div style={{ height: "60vh", overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: "80%", marginRight: 10 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
