import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { search } from "./search.js";
import { generateAnswer } from "./generateAnswer.js";
import { chatTurnSaver } from "./memory/chatTurnSaver.js";
import { getTurns } from "./memory/getTurns.js";
import { getSummaries } from "./memory/getSummaries.js";
import { turnSummarizer } from "./memory/turnSummarizer.js";
import { deleteSummarizedTurns } from "./memory/deleteSummarizedTurns.js";
import greeting from "./modules/greeting.js";
import { collectPII } from "./modules/collectPII.js";
import { confirmSOA } from "./modules/confirmSOA.js";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function docAnalyzer(req, res) {
  const doc_id = req.body.docId;
  const query = req.body.query;
  const publicKey = req.body.publicKey;
  let cid;
  let turns;
  let turnString;
  let summaries;
  let currentStep = req.body.currentStep;
  if (req.body.chatId) {
    cid = req.body.chatId;
    try {
      turns = await getTurns(cid, res);
    } catch (error) {
      console.error(`Error retrieving previous conversation turns.`);
      return res.status(500).json(error);
    }
    console.log(`Turns: ${JSON.stringify(turns)}`);
    const cleanedTurns = turns.objects.map((turn) => {
      return {
        query: turn.properties.query,
        response: turn.properties.response,
        timestamp: turn.properties.timestamp,
        chatId: turn.properties.chatId,
        uuid: turn.uuid,
        vectors: turn.vectors,
        publicKey: turn.properties.publicKey,
      };
    });
    console.log(`Cleaned turns: ${JSON.stringify(cleanedTurns)}`);

    if (cleanedTurns.length < 5) {
      //format the turns and send them to the ai prompt to be included
      //sort the turns, oldest to newest
      const sortedTurns = cleanedTurns.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      );
      turnString = sortedTurns
        .map((turn) => `User: ${turn.query}\nAssistant: ${turn.response}`)
        .join("\n\n");

      //check to see if there is a saved summary already
      // and if so, pull it to be included in the ai prompt
      try {
        summaries = await getSummaries(cid, res);
      } catch (error) {
        console.error(`Error attempting to retrieve chat summaries.`);
        return res.status(500).json(error);
      }
    } else if (cleanedTurns.length === 5) {
      //get the oldest 3 turns
      const sortedTurns = cleanedTurns.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      );
      const oldestThree = sortedTurns.slice(0, 3);
      console.log("Oldest three:", oldestThree);

      //send the oldest 3 to be summarized
      try {
        summaries = await turnSummarizer(oldestThree, cid, res);
      } catch (error) {
        console.error(`Error while attempting to summarize oldest turns.`);
        return res.status(500).json(error.message);
      }

      //then delete the oldest 3 turns
      try {
        await deleteSummarizedTurns(oldestThree, res);
      } catch (error) {
        console.error(`Error attempting to delete oldest three turns.`);
        return res.status(500).json(error);
      }

      // Take the most recent 2
      const latestTwo = sortedTurns.slice(-2);
      console.log("Latest two:", latestTwo);

      //format the turns and send them to the ai prompt to be included
      turnString = latestTwo
        .map((turn) => `User: ${turn.query}\nAssistant: ${turn.response}`)
        .join("\n\n");
    }
  } else if (!req.body.chatId) {
    cid = uuidv4();

    //create the chat object here
    const chatObject = {
      chatId: cid,
    };
  }

  let docs;
  try {
    docs = await search(query, doc_id, res);
  } catch (error) {
    console.error("Error performing vector query.");
    return res.status(500).send(error);
  }
  let answer;
  try {
    //these change to returns
    switch (currentStep) {
      case "start_conversation":
        answer = await greeting(
          docs,
          query,
          res,
          turnString,
          summaries,
          cid,
          publicKey,
        );
        break;
      case "gather_PII":
        answer = await collectPII(
          docs,
          query,
          res,
          turnString,
          summaries,
          cid,
          publicKey,
        );
        break;
      case "confirm_soa":
        answer = await confirmSOA(
          docs,
          query,
          res,
          turnString,
          summaries,
          cid,
          publicKey,
        );
        break;
    }
  } catch (error) {
    console.error("Error trying to generate an answer to the query.", error);
    return res.status(500).send(error);
  }
}
