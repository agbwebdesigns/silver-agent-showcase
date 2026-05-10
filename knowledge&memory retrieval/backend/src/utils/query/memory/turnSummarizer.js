import OpenAI from "openai";
import { summarySaver } from "./summarySaver.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function turnSummarizer(turns, cid, res) {
  const turnString = turns
    .map((turn) => `User: ${turn.query}\nAssistant: ${turn.response}`)
    .join("\n\n");
  const userPrompt = `
Below are the oldest three turns from a chat conversation with a user.  Summarize these chat turns so the summary can be used as the oldest part of chat history with an llm.

--- TURN TEXT START ---
${turnString}
--- TURN TEXT END ---
`;

  let response;
  try {
    response = await openai.responses.parse({
      model: "o4-mini",
      input: [
        {
          role: "system",
          content: `
You are a conversation summarizer. Your task is to compress the oldest 3 user–assistant turns into a short summary that preserves the essential context so another AI model can continue the conversation seamlessly.

Guidelines:
- Always include the user’s main questions, concerns, or personal details relevant to the conversation.  
- Always include the assistant’s key explanations or follow-up questions.  
- Keep chronological order so the conversation flow is clear.  
- Be concise (3–6 sentences), but preserve all details that are important for understanding the user’s situation.  
- Do not add new information.  
- Write in natural language, as if telling a colleague what has happened so far.
`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });
  } catch (error) {
    console.error("Error calling gpt analysis.");
    return res.status(500).send(error);
  }

  const cleaned = response.output_text
    // remove code fences if present
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    // remove page-break artifacts (common in PDFs: “\f” or stray dashes/numbers)
    .replace(/\f/g, " ")
    .replace(/-\s*\n/g, "") // join hyphenated words broken by line wrap
    .replace(/\n+/g, " ") // collapse newlines into spaces
    .replace(/\s{2,}/g, " ") // collapse multiple spaces
    .trim();

  try {
    await summarySaver(cleaned, cid, res);
    return cleaned;
  } catch (error) {
    console.error(`Error save a summary.`);
    return res.status(500).json(error);
  }
}
