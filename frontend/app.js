const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const clearButton = document.querySelector("#clear-button");
const messageList = document.querySelector("#message-list");
const statusMessage = document.querySelector("#status-message");

let messages = [];

function setStatus(text = "", isError = false) {
  statusMessage.textContent = text;
  statusMessage.classList.toggle("error", isError);
}

function addMessage(role, content) {
  const article = document.createElement("article");
  article.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;

  const label = document.createElement("div");
  label.className = "message-label";
  label.innerHTML = `${role === "user" ? "YOU" : "ORBIT"} <span>${role === "user" ? "NOW" : "REPLY"}</span>`;

  const paragraph = document.createElement("p");
  paragraph.textContent = content;
  article.append(label, paragraph);
  messageList.appendChild(article);
  messageList.scrollTop = messageList.scrollHeight;
}

function setLoading(isLoading) {
  input.disabled = isLoading;
  sendButton.disabled = isLoading;
  sendButton.querySelector("span:first-child").textContent = isLoading ? "Thinking" : "Send";
}

function resetConversation() {
  messages = [];
  messageList.innerHTML = `
    <article class="message assistant-message welcome-message">
      <div class="message-label">ORBIT <span>NOW</span></div>
      <p>Hi, I’m Orbit. Ask me anything, then build on the answer with a follow-up. I’ll remember the conversation.</p>
    </article>`;
  input.focus();
  setStatus();
}

async function sendMessage(content) {
  messages.push({ role: "user", content });
  addMessage("user", content);
  setLoading(true);
  setStatus("Orbit is thinking...");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The request failed.");
    }

    messages.push({ role: "assistant", content: data.reply });
    addMessage("assistant", data.reply);
    setStatus();
  } catch (error) {
    messages.pop();
    setStatus(error.message, true);
  } finally {
    setLoading(false);
    input.focus();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content || sendButton.disabled) return;
  input.value = "";
  input.style.height = "auto";
  await sendMessage(content);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

clearButton.addEventListener("click", resetConversation);
