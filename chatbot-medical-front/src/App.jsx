import React, { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input.trim() }),
      });

      const data = await res.json();

      const botReply = {
        sender: "bot",
        text: data.answer || "Désolé, je n'ai pas de réponse à cela.",
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Erreur de connexion au serveur." },
      ]);
    }

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background font-sans flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white rounded-tr-2xl rounded-br-2xl shadow-xl p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-primary mb-6">MedBot Menu</h2>
        <button
          onClick={() => setMessages([])}
          className="mb-2 px-4 py-2 rounded bg-accent text-white hover:bg-teal-600 transition w-full text-left"
        >
          Nouvelle conversation
        </button>
        <button className="mb-2 px-4 py-2 rounded bg-primary text-white hover:bg-blue-700 transition w-full text-left">
          Historique
        </button>
      </aside>

      {/* Contenu principal */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col p-6 items-center">
        <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-2">
          🩺 MedBot Assistant
        </h1>

        <div className="w-full max-w-3xl bg-white rounded-2xl p-6 space-y-6 border border-accent flex flex-col flex-grow">
          {/* En-tête */}
          <div className="mb-4 border-b border-gray-300 pb-2">
            <h2 className="text-xl font-semibold text-accent text-center">
              {messages.length
                ? "Conversation"
                : "Bonjour, comment puis-je vous aider ?"}
            </h2>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 mt-20">
                Commencez la conversation en écrivant un message.
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.sender === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-xl shadow text-white max-w-[70%] ${
                    msg.sender === "user" ? "bg-primary" : "bg-accent"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="flex mt-4">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre question médicale..."
              className="flex-grow border border-gray-300 rounded-l-xl px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSend}
              className="bg-accent text-white px-6 py-2 rounded-r-xl hover:bg-teal-600 transition-all"
            >
              Envoyer
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto py-2 text-sm text-secondary">
          Développé par <strong className="text-accent">Pura</strong> – v0
        </div>
      </main>
    </div>
  );
}

export default App;
