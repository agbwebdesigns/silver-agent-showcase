import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ChatBox from "./components/ChatBox.jsx";
import SOAForms from "../../soa-form/src/components/SOAForm.jsx";
import avatar from "./assets/avatar_transparent-background.png";

function App({ publicKey }) {
  const [chatDisplay, setChatDisplay] = useState(false);
  const [messages, setMessages] = useState(() => {
    return (
      JSON.parse(sessionStorage.getItem("silverAgent_chatTurns")) || [
        {
          id: 1,
          sender: "agent",
          text: `Hello! I'm Silver Agent, an AI assistant that provides general Medicare information. I do not provide insurance advice or plan
                  recommendations. Please do not share sensitive personal or
                  medical information in this chat. A licensed Medicare
                  insurance agent can assist you with personal plan options.How can I help you today?`,
        },
      ]
    );
  });
  const [chatId, setChatId] = useState(() => {
    return sessionStorage.getItem("silverAgent_chatId") || null;
  });
  const [chatModule, setChatModule] = useState(() => {
    return (
      sessionStorage.getItem("silverAgent_chatModule") || "start_conversation"
    );
  });

  useEffect(() => {
    sessionStorage.setItem("silverAgent_chatModule", chatModule);
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            chatDisplay === false ? (
              <button
                className="expand-button"
                onClick={() => setChatDisplay(true)}
              >
                Ask Silver Agent
              </button>
            ) : (
              <div className="App">
                <header className="App-header">
                  <h1>Silver Agent</h1>
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => setChatDisplay(false)}
                    aria-label="Minimize chat"
                  >
                    ×
                  </button>
                </header>
                <main className="main">
                  <div className="img-container">
                    <img alt="Silver Agent Avatar" src={avatar} />
                  </div>

                  <ChatBox
                    publicKey={publicKey}
                    messages={messages}
                    setMessages={setMessages}
                    chatId={chatId}
                    setChatId={setChatId}
                    chatModule={chatModule}
                    setChatModule={setChatModule}
                  />
                </main>
                <footer className="footer">
                  {""}
                  <p>
                    Silver Agent is not affiliated with or endorsed by Medicare,
                    the Centers for Medicare & Medicaid Services (CMS), or any
                    government agency.
                  </p>
                  <nav className="footerLinks">
                    <a
                      href="https://silver-agent-legal.vercel.app/#/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                    |
                    <a
                      href="https://silver-agent-legal.vercel.app/#/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms of Service
                    </a>
                  </nav>
                  <p>© 2026 Silver Agent. All rights reserved.</p>
                </footer>
              </div>
            )
          }
        />
        <Route path="/soa-form" element={<SOAForms />} />
      </Routes>
    </Router>
  );
}

export default App;
