import weaviate, { Filters } from "weaviate-client";

const weaviateUrl = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;

export async function getTurns(cid, res) {
  let client;
  try {
    client = await weaviate.connectToWeaviateCloud(
      weaviateUrl, // Replace with your Weaviate Cloud URL
      {
        authCredentials: new weaviate.ApiKey(weaviateApiKey), // Replace with your Weaviate Cloud API key
      },
    );
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
  const scannedDocumentsCollection = client.collections.use("ChatTurns");

  let response;
  try {
    // --- 4. Build the query using the collection object ---
    response = await scannedDocumentsCollection.query.fetchObjects({
      // Use Filters for where conditions
      filters: scannedDocumentsCollection.filter
        .byProperty("chatId")
        .equal(cid),
      // Specify the properties to return using returnProperties
      returnProperties: ["query", "response", "timestamp", "chatId"],
      limit: 5,
    });
  } catch (error) {
    console.error(
      `Error while attempting to fetch Weaviate documents, ${error}`,
    );
    return res.status(500).send(error);
  }
  return response;
}
