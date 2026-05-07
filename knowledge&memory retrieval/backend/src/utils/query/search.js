import weaviate from "weaviate-client";
import OpenAI from "openai";

const weaviateUrl = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function search(query, doc_id, res) {
  async function getEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      console.log(`Response Embedding: ${typeof response.data[0].embedding}`);
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating openai embedding.", error);
      return res.status(500).send(error);
    }
  }

  let queryVector;
  try {
    queryVector = await getEmbedding(query);
  } catch (error) {
    console.error("Error attempting to get openai embedding", error);
    return res.status(500).send(error);
  }

  let client;
  try {
    client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
    });
  } catch (error) {
    console.error(`Error connecting to Weaviate Cloud, ${error}`);
    return res.status(500).send(error);
  }

  try {
    const clientReadiness = await client.isReady();
    console.log(`The client is ready: ${clientReadiness}`); // Should return `true`
  } catch (error) {
    console.error(
      `Error while attempting to determine Weaviate client readiness, ${error}`,
    );
    return res.status(500).send(error);
  }

  try {
    const scannedDocumentsCollection = client.collections.use("ScannedChunks");

    if (!Array.isArray(queryVector) || queryVector.length !== 1536) {
      console.error("Invalid query vector:", queryVector);
      return res.status(400).send("Invalid query vector");
    }

    // --- 4. Build the query using the collection object ---
    const response = await scannedDocumentsCollection.query.nearVector(
      queryVector,
      {
        limit: 3,
        // Use Filters for where conditions
        filters: scannedDocumentsCollection.filter
          .byProperty("document_id")
          .equal(doc_id),
        // Specify the properties to return using returnProperties
        returnProperties: [
          "topicHeading",
          "topicText",
          "sectionNumber",
          "sectionTitle",
        ],
        // If you want metadata like distance or certainty, use returnMetadata
        returnMetadata: ["distance"], // or { certainty: true } if applicable
      },
    );
    return response;
  } catch (error) {
    console.error("Error retrieving vector response from database.", error);
    return res.status(500).send("Internal server error during vector search");
  }
}
