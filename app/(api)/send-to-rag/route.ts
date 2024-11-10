import { config } from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

config(); // Load environment variables from .env

// Define an interface for the retrieval results
interface RetrievalResult {
  id: string;
  score: number;
  contractName: string;
  functionName?: string;
  functionType?: string;
  functionCode: string;
}

async function retrieveCode(queryText: string, topK = 5): Promise<RetrievalResult[]> {
  // Step 1: Initialize OpenAI Embeddings
  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Step 2: Generate embedding for the query
  const queryEmbedding = await openAIEmbeddings.embedQuery(queryText);

  // Step 3: Initialize Pinecone Client
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    throw new Error('Pinecone environment variables are not set properly.');
  }

  const pinecone = new Pinecone({
    apiKey,
  });

  // Get the index
  const index = pinecone.index(indexName);

  // Step 4: Query the index
  const queryResponse = await index.query({
    topK,
    vector: queryEmbedding,
    includeValues: false,
    includeMetadata: true,
  });

  // Step 5: Process the results
  const results: RetrievalResult[] = queryResponse.matches.map(match => {
    return {
      id: match.id,
      score: match.score ?? 0,
      contractName: String(match.metadata?.contractName || ''),
      functionName: match.metadata?.functionName as string | undefined,
      functionType: match.metadata?.functionType as string | undefined,
      functionCode: String(match.metadata?.functionCode || ''),
    };
  });

  return results;
}

// Example usage:
async function main() {
  const queryText = 'Clarity smart contract for swapping tokens'; // Adjust your query as needed
  const topK = 1; 
  const results = await retrieveCode(queryText, topK);

  if (results.length > 0) {
    console.log(`Found ${results.length} results for query: "${queryText}"\n`);
    results.forEach((result, idx) => {
      console.log(`Result ${idx + 1}:`);
      console.log(`Score: ${result.score}`);
      console.log(`ID: ${result.id}`);
      console.log(`Contract Name: ${result.contractName}`);
      if (result.functionName) {
        console.log(`Function Name: ${result.functionName}`);
        console.log(`Function Type: ${result.functionType}`);
      } else {
        console.log(`Entire Contract`);
      }
      console.log('Code:');
      console.log(result.functionCode);
      console.log('----------------------------------------\n');
    });
  } else {
    console.log(`No results found for query: "${queryText}"`);
  }
}

main().catch(err => {
  console.error('Error:', err);
});
