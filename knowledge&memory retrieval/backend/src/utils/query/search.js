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
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating openai embedding.", error);
      return res.status(500).send(error);
    }
  }

  // --- 1. Get the embedding for the query ---
  let queryVector;
  try {
    queryVector = await getEmbedding(query);
  } catch (error) {
    console.error("Error attempting to get openai embedding", error);
    return res.status(500).send(error);
  }

  // --- 2. Connect to Weaviate Cloud ---
  let client;
  try {
    client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
    });
  } catch (error) {
    console.error(`Error connecting to Weaviate Cloud, ${error}`);
    return res.status(500).send(error);
  }

  // --- 3. Validate that Weaviate is ready  ---
  try {
    const clientReadiness = await client.isReady();
  } catch (error) {
    console.error(
      `Error while attempting to determine Weaviate client readiness, ${error}`,
    );
    return res.status(500).send(error);
  }

  // --- 3.5. Get the collection where the knowledgebase is stored and validate it before querying ---
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
