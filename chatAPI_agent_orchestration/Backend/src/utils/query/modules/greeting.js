import OpenAI from "openai";
import { chatTurnSaver } from "../memory/chatTurnSaver.js";
import { logTurnToFirehose } from "../memory/firehoseLogger.js";
import getAgencyMetadata from "../tools/getAgencyMetadata.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Schema exposed to the AI
const tools = [
  {
    type: "function",
    function: {
      name: "progressStep",
      description: "Progress to the next step in the flow",
      parameters: {
        type: "object",
        properties: {
          nextStep: {
            type: "string",
            enum: ["gather_PII"],
          },
        },
        required: ["nextStep"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAgencyMetadata",
      description:
        "Retrieve saved agency or business metadata for the current tenant so the assistant can answer office-specific questions such as phone number, office hours, booking links, service areas, languages, team members, and about information.",
      parameters: {
        type: "object",
        properties: {
          publicKey: {
            type: "string",
            description:
              "The public key or tenant identifier for the agency whose metadata should be retrieved.",
          },
          fields: {
            type: "array",
            description:
              "The specific metadata fields to retrieve. Only request fields relevant to the user's question.",
            items: {
              type: "string",
              enum: [
                "agencyName",
                "phone",
                "email",
                "address",
                "officeHours",
                "bookingLinks",
              ],
            },
          },
        },
        required: ["publicKey", "fields"],
      },
    },
  },
];

export default async function greeting(
  docs,
  query,
  res,
  turnString,
  chatSummary,
  cid,
  publicKey,
) {
  // Prepare headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  //summaries
  const summaries = docs.objects
    .map((doc) => doc?.properties?.summary)
    .filter(Boolean); // removes undefined/null
  const context = summaries.join("\n\n");

  const prompt = `
This is where your prompt goes. You can include the user query, any relevant context from the document, and instructions for how the assistant should respond.

Make sure to use the provided tools when appropriate to progress the conversation and retrieve necessary information. Always respond with the most helpful and accurate information based on the user's question and the provided context.

${chatSummary ? `Older conversation summary:\n${chatSummary}` : ""}

${
  turnString
    ? `Recent conversation turns, oldest to newest:\n${turnString}`
    : ""
}

Retrieved context:
${context}

User question:
${query}

Response:
`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      tools,
      tool_choice: "auto",
      stream: true,
    });

    let replyText = "";
    let toolCalls = [];

    for await (const chunk of response) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;

      const delta = choice.delta || {};

      // Handle assistant text chunks
      if (delta.content) {
        replyText += delta.content;
        res.write(
          `data: ${JSON.stringify({
            type: "text",
            content: delta.content,
          })}\n\n`,
        );
      }

      // Handle tool calls
      if (delta.tool_calls) {
        for (const toolCallDelta of delta.tool_calls) {
          const index = toolCallDelta.index ?? 0;

          if (!toolCalls[index]) {
            toolCalls[index] = {
              id: toolCallDelta.id,
              name: toolCallDelta.function?.name,
              args: "",
            };
          }

          if (toolCallDelta.function?.arguments) {
            toolCalls[index].args += toolCallDelta.function.arguments;
          }
        }
      }
    }

    // After streaming ends, check tool calls
    for (const toolCall of toolCalls) {
      if (!toolCall) continue;
      const { id, name, args } = toolCall;

      if (name === "progressStep") {
        let parsed;
        try {
          parsed = JSON.parse(args);
        } catch (err) {
          console.error("Failed to parse tool args:", args, err);
          continue;
        }

        const nextStep = parsed.nextStep;

        // Follow-up LLM call with tool response
        const followup = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [
            { role: "user", content: prompt },
            {
              role: "assistant",
              tool_calls: [
                {
                  id,
                  type: "function",
                  function: { name, arguments: args },
                },
              ],
            },
            {
              role: "tool",
              tool_call_id: id,
              content: JSON.stringify({
                success: true,
                nextStep,
              }),
            },
          ],
        });

        const finalReply = followup.choices[0].message.content;

        res.write(
          `data: ${JSON.stringify({
            type: "final",
            reply: finalReply,
            nextStep,
            cid,
          })}\n\n`,
        );
        res.write("event: done\n\n");
        res.end();

        chatTurnSaver(query, finalReply, cid, publicKey).catch((err) =>
          console.error("Turn save failed:", err),
        );
        return;
      } else if (name === "getAgencyMetadata") {
        let parsed;
        try {
          parsed = JSON.parse(args);
        } catch (err) {
          console.error("Failed to parse tool args:", args, err);
          continue;
        }

        const { fields } = parsed;

        const metadata = await getAgencyMetadata({ publicKey, fields });

        const followup = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [
            { role: "user", content: prompt },
            {
              role: "assistant",
              tool_calls: [
                {
                  id,
                  type: "function",
                  function: {
                    name,
                    arguments: args,
                  },
                },
              ],
            },
            {
              role: "tool",
              tool_call_id: id,
              content: JSON.stringify(metadata),
            },
          ],
        });

        const finalReply = followup.choices[0].message.content ?? "";

        res.write(
          `data: ${JSON.stringify({
            type: "final",
            reply: finalReply,
            cid,
          })}\n\n`,
        );
        res.write("event: done\n\n");
        res.end();

        chatTurnSaver(query, finalReply, cid, publicKey).catch((err) =>
          console.error("Turn save failed:", err),
        );
        return;
      }
    }

    // No tools → just return text
    res.write(
      `data: ${JSON.stringify({
        type: "final",
        reply: replyText,
        cid,
      })}\n\n`,
    );
    res.write("event: done\n\n");
    res.end();

    chatTurnSaver(query, replyText, cid, publicKey).catch((error) => {
      console.error(
        "Error attempting to save turn to Weaviate in greeting.",
        error,
      );
    });

    return;
  } catch (error) {
    console.error("Error in AI pipeline:", error);
    return res.status(500).send(error);
  }
}
