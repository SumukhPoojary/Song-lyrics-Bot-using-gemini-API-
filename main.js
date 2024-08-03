import { GoogleGenerativeAI } from "@google/generative-ai";
import md from "markdown-it";
import axios from 'axios';

// Initialize the models
const genAI = new GoogleGenerativeAI(`${"AIzaSyDP6MGK_SZ_XK_qZdVlc_zke4gtQj_-ugs"}`);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const stabilityAPIKey = "sk-ojoqFmoSwx3CGfw0qUDsQC7wcWQqefwlkomuna9vEdfFZEdA";
const stabilityAPIUrl = "https://api.stability.ai/v2beta/generate";

// Text and image generation history
let history = [];

const songWords = ["lyrics", "song", "music", "melody", "verse", "chorus", "artist", "album"];

const sampleQuestions = [
  "What are some iconic song lyrics?",
  "How can I analyze the meaning behind song lyrics?",
  "What are some popular music genres?",
  "What are the characteristics of a memorable chorus?",
  "How do artists create emotional depth in their lyrics?",
  "What should I look for in a well-written song verse?",
  "How can I identify the influences behind an album's lyrics?",
  "What are some techniques for writing catchy song lyrics?",
  "How do musicians incorporate storytelling into their songs?",
  "What are some ways to interpret poetic language in lyrics?"
];

function isSongRelated(prompt) {
  return songWords.some(keyword => prompt.toLowerCase().includes(keyword));
}

async function getResponse(prompt) {
  const songprompt = `As a songs and lyrics assistant, please give me the full lyrics: ${prompt}`;
  
  const chat = await model.startChat({ history: history });
  const result = await chat.sendMessage(songprompt);
  const response = await result.response;
  const text = response.text();

  console.log(text);
  return text;
}

async function generateImage(prompt) {
  const response = await axios.post(stabilityAPIUrl, {
    prompt: prompt,
    apiKey: stabilityAPIKey,
    options: {
      width: 512,
      height: 512,
      samples: 1
    }
  });
  
  const imageUrl = response.data.artifacts[0].url;
  console.log(imageUrl);
  return imageUrl;
}

// User chat div
export const userDiv = (data) => {
  return `
  <!-- User Chat -->
          <div class="flex items-center gap-2 justify-start m-2">
            <img src="human.png" alt="user icon" class="w-10 h-10 rounded-full"/>
            <div class="bg-gemDeep text-white p-1 rounded-md shadow-md mx-2">${data}</div>
          </div>
  `;
};

// AI Chat div
export const aiDiv = (data, showIcon = true, isImage = false) => {
  return `
  <!-- AI Chat -->
          <div class="flex gap-2 justify-end m-2">
            ${isImage ? `<img src="${data}" alt="Generated Image" class="w-64 h-64 rounded-md shadow-md mx-2"/>` : `<div class="bg-gemDeep text-white p-1 rounded-md shadow-md mx-2">${data}</div>`}
            ${showIcon ? '<img src="bot.png" alt="bot icon" class="w-10 h-10 rounded-full"/>' : ''}
          </div>
  `;
};

async function handleSubmit(event) {
  event.preventDefault();

  let userMessage = document.getElementById("prompt");
  const chatArea = document.getElementById("chat-container");

  var prompt = userMessage.value.trim();
  if (prompt === "") {
    return;
  }

  console.log("user message", prompt);

  chatArea.innerHTML += userDiv(md().render(prompt));
  userMessage.value = "";

  if (prompt.toLowerCase() === "what are the questions i can ask" || prompt.toLowerCase() === "sample questions") {
    const sampleQuestionsText = "Here are some sample questions you can ask:\n\n" + sampleQuestions.map(q => `- ${q}`).join("\n");
    chatArea.innerHTML += aiDiv(md().render(sampleQuestionsText));
  } else if (isSongRelated(prompt)) {
    const aiResponse = await getResponse(prompt);
    let md_text = md().render(aiResponse);
    chatArea.innerHTML += aiDiv(md_text);

    let newUserRole = {
      role: "user",
      parts: prompt,
    };
    let newAIRole = {
      role: "model",
      parts: aiResponse,
    };

    history.push(newUserRole);
    history.push(newAIRole);
  } else {
    const redirectMessage = "Please ask questions related to songs and lyrics.";
    chatArea.innerHTML += aiDiv(md().render(redirectMessage));
  }

  // Check if the prompt is an image request
  if (prompt.toLowerCase().includes("generate image")) {
    const imagePrompt = prompt.replace("generate image", "").trim();
    const imageUrl = await generateImage(imagePrompt);
    chatArea.innerHTML += aiDiv(imageUrl, true, true);
  }

  console.log(history);
}

function greetUser() {
  const chatArea = document.getElementById("chat-container");
  const greeting = "Hello! I am song lyrics assistant. How can I help you today?";
  chatArea.innerHTML += aiDiv(md().render(greeting), false);
}

const chatForm = document.getElementById("chat-form");
chatForm.addEventListener("submit", handleSubmit);



// Get the elements
const chatbotPopup = document.getElementById('chatbot-popup');
const openChatbotButton = document.getElementById('open-chatbot');

// Event to open the chatbot
openChatbotButton.addEventListener('click', () => {
    chatbotPopup.style.display = 'block';
    greetUser();
});

const closeChatbotButton = document.getElementById('close-chatbot');

// Event to close the chatbot
closeChatbotButton.addEventListener('click', () => {
    chatbotPopup.style.display = 'none';
});
