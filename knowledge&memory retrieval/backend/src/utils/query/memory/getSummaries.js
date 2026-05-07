import weaviate, { Filters } from "weaviate-client";

const weaviateUrl = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;

export async function getSummaries(cid, res) {
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
  const scannedDocumentsCollection = client.collections.use("ChatSummaries");

  let response;
  try {
    // --- 4. Build the query using the collection object ---
    response = await scannedDocumentsCollection.query.fetchObjects({
      // Use Filters for where conditions
      filters: scannedDocumentsCollection.filter
        .byProperty("chatId")
        .equal(cid),
      // Specify the properties to return using returnProperties
      returnProperties: ["summary", "timestamp", "chatId"],
      limit: 1,
    });
  } catch (error) {
    console.error(
      `Error while attempting to fetch Weaviate documents, ${error}`,
    );
    return res.status(500).send(error);
  }
  if (!response.objects || response.objects.length === 0) {
    // No summaries exist yet for this chatId
    console.log("No summaries found yet for this chatId:", cid);
    return null; // or return [] or some fallback
  } else if (response.objects || response.objects.length > 0) {
    return response.objects[0].properties;
  }
}
