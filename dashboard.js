// ========================================

// NOVA AI CHATBOT

// Ollama + Llama 3.2 + Local Storage

// ========================================

const OLLAMA_URL = "http://localhost:11434/api/chat";

const MODEL = "llama3.2:latest";

const SYSTEM_PROMPT = `

You are Nova, a smart, friendly and helpful AI assistant.

Your responsibilities:

1. Understand the user's question carefully.

2. Answer exactly what the user asks.

3. Give accurate and relevant information.

4. Explain difficult topics in simple English.

5. Give step-by-step explanations when needed.

6. Use practical examples.

7. For programming questions, provide correct code and explain it.

8. Do not make up facts or pretend to know something you do not know.

9. Avoid unnecessary repetition.

10. Be friendly, professional and clear.

Always focus on the user's actual question.

`;

// ========================================

// ELEMENTS

// ========================================

const chatForm = document.getElementById("chatForm");

const userInput = document.getElementById("userInput");

const sendButton = document.getElementById("sendButton");

const chatMessages = document.getElementById("chatMessages");

const welcomeScreen = document.getElementById("welcomeScreen");

const chatArea = document.getElementById("chatArea");

const typingIndicator = document.getElementById("typingIndicator");

const newChatButton = document.getElementById("newChatButton");

const clearChatButton = document.getElementById("clearChatButton");

const clearHistoryButton = document.getElementById("clearHistoryButton");

const chatHistoryList = document.getElementById("chatHistoryList");

const historyCount = document.getElementById("historyCount");

const menuButton = document.getElementById("menuButton");

const sidebar = document.getElementById("sidebar");

const homeButton = document.getElementById("homeButton");

// ========================================

// LOCAL STORAGE

// ========================================

function getSavedConversations() {

    try {

        return JSON.parse(localStorage.getItem("novaChats")) || [];

    } catch (error) {

        console.error("Could not read saved chats:", error);

        return [];

    }

}

let conversations = getSavedConversations();

let chatHistory = [];

let currentChatId = null;

let activeRequest = null;

// ========================================

// SAVE CONVERSATIONS

// ========================================

function saveConversations() {

    try {

        localStorage.setItem(

            "novaChats",

            JSON.stringify(conversations)

        );

    } catch (error) {

        console.error("Could not save conversations:", error);

        alert("Unable to save chat history. Browser storage may be full.");

    }

}

// ========================================

// CREATE NEW CHAT

// ========================================

function createNewChat() {

    currentChatId = null;

    chatHistory = [];

    if (activeRequest) {

        activeRequest.abort();

        activeRequest = null;

    }

    sendButton.disabled = false;

    typingIndicator.style.display = "none";

    chatMessages.innerHTML = "";

    userInput.value = "";

    showWelcomeScreen();

    closeSidebar();

}

// ========================================

// GET CURRENT CONVERSATION

// ========================================

function getCurrentChat() {

    return conversations.find(

        chat => chat.id === currentChatId

    );

}

// ========================================

// SAVE MESSAGE

// ========================================

function saveMessage(role, content) {

    // Create a conversation if one is not selected

    if (!currentChatId) {

        const newChat = {

            id: Date.now().toString() + Math.random().toString(36).slice(2),

            title: "New Chat",

            messages: [],

            createdAt: new Date().toISOString()

        };

        conversations.unshift(newChat);

        currentChatId = newChat.id;

    }

    const chat = getCurrentChat();

    if (!chat) return;

    chat.messages.push({

        role: role,

        content: content

    });

    // Use the first user message as the chat title

    if (role === "user" && chat.title === "New Chat") {

        chat.title = content.length > 32

            ? content.substring(0, 32) + "..."

            : content;

    }

    saveConversations();

    renderChatHistory();

}

// ========================================

// DISPLAY CHAT HISTORY

// ========================================

function renderChatHistory() {

    chatHistoryList.innerHTML = "";

    historyCount.textContent = conversations.length;

    if (conversations.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-history";

        emptyMessage.textContent = "No conversations yet";

        chatHistoryList.appendChild(emptyMessage);

        return;

    }

    conversations.forEach(chat => {

        const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        if (chat.id === currentChatId) {

            historyItem.classList.add("selected");

        }

        const title = document.createElement("span");

        title.className = "history-title";

        title.textContent = chat.title || "New Chat";

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-history";

        deleteButton.textContent = "×";

        deleteButton.title = "Delete conversation";

        deleteButton.addEventListener("click", function(event) {

            event.stopPropagation();

            deleteConversation(chat.id);

        });

        historyItem.appendChild(title);

        historyItem.appendChild(deleteButton);

        historyItem.addEventListener("click", function() {

            loadChat(chat.id);

        });

        chatHistoryList.appendChild(historyItem);

    });

}

// ========================================

// LOAD OLD CONVERSATION

// ========================================

function loadChat(id) {

    const chat = conversations.find(

        conversation => conversation.id === id

    );

    if (!chat) return;

    if (activeRequest) {

        activeRequest.abort();

        activeRequest = null;

    }

    currentChatId = id;

    chatHistory = chat.messages.map(message => ({

        role: message.role,

        content: message.content

    }));

    chatMessages.innerHTML = "";

    chat.messages.forEach(message => {

        addMessage(message.role, message.content);

    });

    sendButton.disabled = false;

    typingIndicator.style.display = "none";

    showChat();

    renderChatHistory();

    closeSidebar();

}

// ========================================

// DELETE ONE CONVERSATION

// ========================================

function deleteConversation(id) {

    const confirmed = confirm(

        "Are you sure you want to delete this conversation?"

    );

    if (!confirmed) return;

    conversations = conversations.filter(

        chat => chat.id !== id

    );

    if (currentChatId === id) {

        createNewChat();

    }

    saveConversations();

    renderChatHistory();

}

// ========================================

// DELETE ALL HISTORY

// ========================================

function clearAllHistory() {

    if (conversations.length === 0) {

        alert("There is no saved chat history.");

        return;

    }

    const confirmed = confirm(

        "Are you sure you want to delete all conversations?"

    );

    if (!confirmed) return;

    if (activeRequest) {

        activeRequest.abort();

        activeRequest = null;

    }

    conversations = [];

    currentChatId = null;

    chatHistory = [];

    saveConversations();

    chatMessages.innerHTML = "";

    typingIndicator.style.display = "none";

    sendButton.disabled = false;

    renderChatHistory();

    showWelcomeScreen();

}

// ========================================

// CLEAR CURRENT CHAT

// ========================================

function clearCurrentChat() {

    if (currentChatId) {

        conversations = conversations.filter(

            chat => chat.id !== currentChatId

        );

        saveConversations();

    }

    createNewChat();

    renderChatHistory();

}

// ========================================

// SWITCH SCREENS

// ========================================

function showWelcomeScreen() {

    welcomeScreen.style.display = "flex";

    chatArea.style.display = "none";

}

function showChat() {

    welcomeScreen.style.display = "none";

    chatArea.style.display = "block";

}

// ========================================

// ADD MESSAGE TO SCREEN

// ========================================

function addMessage(role, content) {

    const isUser = role === "user";

    const messageRow = document.createElement("div");

    messageRow.className = isUser

        ? "message-row user-row"

        : "message-row ai-row";

    const avatar = document.createElement("div");

    avatar.className = isUser

        ? "message-avatar user-avatar"

        : "message-avatar ai-avatar";

    avatar.textContent = isUser ? "U" : "✦";

    const messageContent = document.createElement("div");

    messageContent.className = "message-content";

    const messageName = document.createElement("div");

    messageName.className = "message-name";

    messageName.textContent = isUser ? "You" : "Nova AI";

    const messageBubble = document.createElement("div");

    messageBubble.className = "message-bubble";

    // textContent prevents HTML injection

    messageBubble.textContent = content;

    messageContent.appendChild(messageName);

    messageContent.appendChild(messageBubble);

    if (isUser) {

        messageRow.appendChild(messageContent);

        messageRow.appendChild(avatar);

    } else {

        messageRow.appendChild(avatar);

        messageRow.appendChild(messageContent);

    }

    chatMessages.appendChild(messageRow);

    chatArea.scrollTop = chatArea.scrollHeight;

}

// ========================================

// SEND MESSAGE TO OLLAMA

// ========================================

async function sendMessage(message) {

    const userMessage = message.trim();

    if (!userMessage || activeRequest) return;

    showChat();

    const requestChatId = currentChatId;

    // Display and store the user's message

    addMessage("user", userMessage);

    chatHistory.push({

        role: "user",

        content: userMessage

    });

    saveMessage("user", userMessage);

    const conversationId = currentChatId;

    userInput.value = "";

    userInput.style.height = "auto";

    typingIndicator.style.display = "flex";

    sendButton.disabled = true;

    const controller = new AbortController();

    activeRequest = controller;

    try {

        const response = await fetch(OLLAMA_URL, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                model: MODEL,

                messages: [

                    {

                        role: "system",

                        content: SYSTEM_PROMPT

                    },

                    ...chatHistory

                ],

                stream: false,

                options: {

                    temperature: 0.7,

                    num_ctx: 4096

                }

            }),

            signal: controller.signal

        });

        if (!response.ok) {

            throw new Error(

                "Ollama returned an error: " + response.status

            );

        }

        const data = await response.json();

        const aiReply = data.message?.content?.trim();

        if (!aiReply) {

            throw new Error("Ollama returned an empty response.");

        }

        // Ignore responses from a conversation that is no longer active

        if (currentChatId !== conversationId) return;

        // Display AI response

        addMessage("assistant", aiReply);

        // Add AI response to conversation

        chatHistory.push({

            role: "assistant",

            content: aiReply

        });

        saveMessage("assistant", aiReply);

    } catch (error) {

        if (error.name === "AbortError") {

            return;

        }

        console.error("Chatbot error:", error);

        if (currentChatId === conversationId) {

            let errorMessage =

                "Sorry, I could not connect to Ollama. Please check that Ollama is running.";

            if (error.message.includes("Failed to fetch")) {

                errorMessage =

                    "Connection failed. Make sure Ollama is running and browser access (CORS) is configured.";

            }

            addMessage("assistant", errorMessage);

        }

    } finally {

        if (activeRequest === controller) {

            activeRequest = null;

            typingIndicator.style.display = "none";

            sendButton.disabled = false;

        }

    }

}

// ========================================

// FORM SUBMISSION

// ========================================

chatForm.addEventListener("submit", function(event) {

    event.preventDefault();

    sendMessage(userInput.value);

});

// ========================================

// ENTER TO SEND

// SHIFT + ENTER FOR NEW LINE

// ========================================

userInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        chatForm.requestSubmit();

    }

});

// Automatically increase textarea height

userInput.addEventListener("input", function() {

    this.style.height = "auto";

    this.style.height = Math.min(

        this.scrollHeight,

        130

    ) + "px";

});

// ========================================

// SUGGESTED QUESTIONS

// ========================================

document.querySelectorAll(".suggestion-card").forEach(card => {

    card.addEventListener("click", function() {

        const prompt = this.dataset.prompt;

        sendMessage(prompt);

    });

});

// ========================================

// BUTTON EVENTS

// ========================================

newChatButton.addEventListener("click", createNewChat);

homeButton.addEventListener("click", createNewChat);

clearChatButton.addEventListener("click", clearCurrentChat);

clearHistoryButton.addEventListener("click", clearAllHistory);

// ========================================

// INITIALIZE CHATBOT

// ========================================

function initializeChatbot() {

    renderChatHistory();

    // Restore the most recent conversation after refreshing

    if (conversations.length > 0) {

        const latestChat = conversations[0];

        loadChat(latestChat.id);

    } else {

        showWelcomeScreen();

    }

}

initializeChatbot();