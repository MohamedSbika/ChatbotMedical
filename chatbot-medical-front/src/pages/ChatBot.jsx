import React, { useState, useRef, useEffect } from "react";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function ChatBot() {
  const [conversations, setConversations] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.name) {
        setUserName(decoded.name);
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input.trim() };
    const updatedMessages = [...currentMessages, userMessage];
    setCurrentMessages(updatedMessages);
    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() })
      });
      const data = await res.json();
      const botReply = {
        sender: "bot",
        text: data.answer || "Désolé, je n'ai pas de réponse à cela."
      };
      const finalMessages = [...updatedMessages, botReply];
      setCurrentMessages(finalMessages);
      // Met à jour les conversations avec le dernier snippet
      if (finalMessages.length === 2) {
        setConversations(prev => [
          ...prev,
          {
            id: Date.now(),
            messages: finalMessages,
            snippet: finalMessages[0].text
          }
        ]);
      } else {
        setConversations(prev => {
          const updated = [...prev];
          updated[updated.length - 1].messages = finalMessages;
          updated[updated.length - 1].snippet = finalMessages[0].text;
          return updated;
        });
      }
    } catch (error) {
      setCurrentMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Erreur de connexion au serveur." }
      ]);
    }
    setInput("");
  };

  const handleNewConversation = () => {
    setCurrentMessages([]);
    setShowHistory(false);
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.error("Erreur lors du logout :", error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
      {currentMessages.length === 0 && (
        <p className="text-center text-gray-500 mt-20">
          Commencez la conversation en écrivant un message.
        </p>
      )}
      {currentMessages.map((msg, idx) => (
        <div key={idx} className={msg.sender === "user" ? "text-right" : "text-left"}>
          <div
            className={`inline-block px-4 py-2 rounded-xl shadow max-w-[70%] text-black ${msg.sender === "user" ? "bg-gray-200" : "bg-gray-100"} text-lg`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderHistory = () => (
    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 mt-20">Aucune conversation sauvegardée.</p>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.id}
            className="bg-white border border-gray-300 rounded-xl p-4 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setCurrentMessages(conv.messages);
              setShowHistory(false);
            }}
          >
            <p className="text-sm text-gray-600 truncate">{conv.snippet}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-gray-100 text-black font-sans flex h-screen">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 bg-white rounded-tr-2xl rounded-br-2xl shadow-xl p-6 overflow-y-auto border-r border-gray-300">
        <h2 className="text-xl font-bold mb-6">MedBot Menu</h2>
        <button
          onClick={handleNewConversation}
          className="mb-2 px-4 py-2 rounded bg-white hover:bg-gray-200 text-black transition w-full text-left border border-gray-300"
        >
          Nouvelle conversation
        </button>
        <button
          onClick={handleShowHistory}
          className="mb-2 px-4 py-2 rounded bg-white hover:bg-gray-200 text-black transition w-full text-left border border-gray-300"
        >
          Historique
        </button>
        {showHistory && renderHistory()}
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen flex flex-col p-6 items-center relative bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">🩺 MedBot Assistant</h1>

        <div className="w-full max-w-5xl px-4 bg-white rounded-2xl p-6 space-y-6 border border-gray-300 flex flex-col flex-grow">
          <div className="mb-4 border-b border-gray-300 pb-2">
            <h2 className="text-xl font-semibold text-center text-gray-800">
              {currentMessages.length
                ? "Conversation"
                : `Bonjour${userName ? ", " + userName : ""}, comment puis-je vous aider ?`}
            </h2>
          </div>

          {renderMessages()}

          <div className="flex mt-4">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre question médicale..."
              className="flex-grow bg-white text-black border border-gray-300 rounded-l-xl px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              onClick={handleSend}
              className="bg-gray-200 text-black px-6 py-2 rounded-r-xl hover:bg-gray-300 transition-all"
            >
              Envoyer
            </button>
          </div>
        </div>

        {userName && (
          <button
            onClick={handleLogout}
            className="absolute top-6 right-6 bg-red-100 hover:bg-red-200 text-black px-4 py-2 rounded transition border border-red-300"
          >
            Logout
          </button>
        )}

        <div className="mt-auto py-2 text-sm text-gray-500">
          Développé par <strong className="text-gray-700">Pura</strong> – v0
        </div>
      </main>
    </div>
  );
}

export default ChatBot;
