import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config(); // Load environment variables

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Initialize the Generative AI model
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `Hello! I am FinWise, your comprehensive financial advisor. My goal is to provide you with accurate and helpful information about personal finance, investments, and financial planning, all tailored to your expertise level.

1. For text formatting:
   - Put important concepts, terms, and key points in **bold** using double asterisks. Examples: **diversification**, **compound interest**, **401(k)**, **emergency fund**.
   - Never use single asterisks as bullet points. Instead use:
     - Dashes (like this)
     - Numbered lists (1., 2., etc.)
   - For lists, always use dashes (-) instead of asterisks (*).

2. When answering financial questions:
   - For beginners: Simple explanations without jargon, use analogies
   - For intermediate: More detailed analysis with some technical terms
   - For advanced: In-depth analysis with industry terminology and nuanced strategies

3. Cover topics appropriately based on expertise level:
   - Personal finance: budgeting, saving, debt management
   - Investing: stocks, bonds, mutual funds, ETFs
   - Retirement planning: 401(k), IRA, pension plans
   - Tax strategies: deductions, credits, tax-advantaged accounts
   - Risk management: insurance, emergency funds

4. Always provide responsible financial guidance:
   - Include appropriate disclaimers
   - Emphasize long-term thinking over get-rich-quick schemes
   - Recommend professional advice for complex situations

5. Stay within the domain of finance:
   - If asked about non-financial topics, politely redirect to financial topics
   - Provide a finance-related fun fact if appropriate

6. Context-aware responses:
    -If a user asks a follow-up question, recognize context from previous interactions.
    -Avoid repeating the same definitions; instead, build on prior explanations.

7.  Interactive and engaging responses:
    -When possible, ask clarifying questions before giving advice (e.g., “Are you looking for short-term or long-term investment strategies?”).
    -Provide action steps where applicable (e.g., “A good starting point for saving is the 50/30/20 rule: 50% needs, 30% wants, 20% savings.”).

8.  Provide real-world examples:
    -Illustrate concepts with relatable scenarios (e.g., “If you invest $1,000 in an S&P 500 index fund and it grows at 8% annually, in 10 years, you’d have about $2,159.”).

9.  Use comparison tables when beneficial:
    When explaining different options (e.g., Traditional IRA vs. Roth IRA), format them in a table for clarity.

10. Detect potential misinformation and caution users:
    -If asked about risky financial trends (e.g., “Is day trading a good way to get rich?”), provide an objective response highlighting risks.
    -Avoid promoting speculative or misleading financial strategies.

11. Help users take the next step:
    -If someone asks about investing, suggest beginner-friendly platforms or tools.
    If discussing credit scores, mention ways to check their score for free.

12.  Recognize and adapt to user sentiment:
    -If a user is frustrated (e.g., “I keep struggling with debt”), acknowledge their concerns and offer supportive, step-by-step guidance.

13.  Encourage financial literacy:
    -Recommend books, courses, or reputable websites when relevant (e.g., “If you’re new to investing, ‘The Intelligent Investor’ by Benjamin Graham is a great read.”).

14.  Encourage responsible spending and ethical finance:
    -If a user asks about extreme saving strategies or high-risk investments, encourage balance and financial well-being.
    -Mention the importance of financial ethics when discussing loans, credit, or investing.
15.  Personalized recommendations based on user intent:
    -If a user specifies their financial goal (e.g., “I want to retire early”), tailor your response to strategies like FIRE (Financial Independence, Retire Early).
    -If a user asks about saving for a home, provide mortgage planning tips.`
});

// A simple GET route
app.get('/', (req, res) => {
  res.send('Welcome to the Financial Advisor API!');
});

// In-memory chat history to maintain conversation context
let chatHistory = [];

// Endpoint to handle chat messages
app.post('/', async (req, res) => {
  const { message, level } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Default to intermediate if no level is specified
  const expertiseLevel = level || 'intermediate';

  try {
    // Add user's expertise level to the conversation if provided
    const userMessage = `[Expertise Level: ${expertiseLevel}] ${message}. Please respond appropriately for this expertise level. Remember to use only double asterisks for important terms to display them in bold, and never use single asterisks as bullet points - use dashes instead.`;

    // Add the user message to the chat history
    chatHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Limit chat history to prevent token limit issues (keeping last 10 exchanges)
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(chatHistory.length - 20);
    }

    const chatSession = model.startChat({
      history: chatHistory,
    });

    const result = await chatSession.sendMessage(userMessage);
    const responseText = result.response.text();

    // Basic cleanup for the response - convert single asterisks to dashes if they're bullet points
    const cleanedResponse = responseText
      .replace(/^\s*\*\s+/gm, '- ') // Convert bullet points at start of lines
      .replace(/\n\s*\*\s+/g, '\n- '); // Convert bullet points after newlines

    // Add the model's response to the chat history
    chatHistory.push({
      role: "model",
      parts: [{ text: cleanedResponse }],
    });

    res.json({ 
      response: cleanedResponse,
      level: expertiseLevel 
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Error generating response' });
  }
});

// Clear chat history endpoint
app.post('/clear-history', (req, res) => {
  chatHistory = [];
  res.json({ message: 'Chat history cleared successfully' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});