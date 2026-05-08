import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../functions/linkifyText.jsx";
import DOMPurify from "dompurify";

const ChatBox = ({
  publicKey,
  messages,
  setMessages,
  chatId,
  setChatId,
  chatModule,
  setChatModule,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [partialReply, setPartialReply] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!isStreaming && messages.length > 0) {
      sessionStorage.setItem("silverAgent_chatTurns", JSON.stringify(messages));
    }
  }, [isStreaming, messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!query.trim()) return;

    // 1️⃣ Trim and remove control characters
    let sanitized = query.trim().replace(/[\x00-\x1F\x7F]/g, "");

    // 2️⃣ Regex validation — optional but good practice
    // Only allow typical text, punctuation, emojis, etc.
    const validPattern = /^[\p{L}\p{N}\p{P}\p{Z}\p{S}]{1,1000}$/u;
    if (!validPattern.test(sanitized)) {
      alert("Invalid characters detected.");
      return;
    }

    // 3️⃣ Sanitize with DOMPurify (defense-in-depth)
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    // 4️⃣ Enforce length limit
    if (sanitized.length === 0) return;
    if (sanitized.length > 1000) {
      alert("Message too long");
      return;
    }

    // Add user message to chat
    const userMessage = { id: Date.now(), sender: "user", text: sanitized };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");

    const data = {
      docId: "medicare_handbook_2025",
      query: sanitized,
      ...(chatId ? { chatId } : {}),
      currentStep: chatModule,
      publicKey,
    };

    setIsLoading(true);

    const response = await fetch(`https://somesite.com/doc/analyze/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let nextStep = null;

    // Read the streaming response
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      setIsLoading(false);
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk
        .split("\n\n")
        .filter((line) => line.startsWith("data:"));

      for (const line of lines) {
        const data = JSON.parse(line.replace(/^data:\s*/, ""));

        if (data.type === "text") {
          setPartialReply((prev) => prev + data.content);
          setMessages((prev) => {
            const last = prev[prev.length - 1];

            if (last && last.sender === "agent") {
              // Replace last agent message with updated partial reply
              return [...prev.slice(0, -1), { ...last, text: partialReply }];
            }

            // Otherwise, append a new agent message
            return [
              ...prev,
              { id: new Date(), sender: "agent", text: partialReply },
            ];
          });
        }

        // Handle final message with chatId and nextStep
        if (data.type === "final") {
          setChatId(data.cid);
          sessionStorage.setItem("silverAgent_chatId", data.cid);

          if (data.nextStep) {
            setChatModule(data.nextStep);
            sessionStorage.setItem("silverAgent_chatModule", data.nextStep);
          }
          setMessages((prev) => {
            const last = prev[prev.length - 1];

            if (last && last.sender === "agent") {
              // Replace last agent message with updated partial reply
              return [...prev.slice(0, -1), { ...last, text: data.reply }];
            }

            // Otherwise, append a new agent message
            return [
              ...prev,
              { id: new Date(), sender: "agent", text: data.reply },
            ];
          });
          // udpate messages in session storage
        }
      }
    }

    if (nextStep) {
      setChatModule(nextStep);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="chatInterface">
      <div className="chatWindow">
        {messages.map((msg) => {
          const cm = ChatMessage(msg.text);
          return (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={` chatFrame px-4 py-2 rounded-2xl max-w-xs shadow-md text-white whitespace-normal ${
                  msg.sender === "user" ? "user-chat" : "agent-chat"
                }`}
              >
                {cm}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="messageRow assistant">
            <div className="messageBubble typingBubble">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
      <div className="chatBox">
        <input
          type="text"
          name="input"
          size={100}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => sendMessage()}>Submit (Or press enter)</button>
      </div>
    </div>
  );
};

export default ChatBox;
