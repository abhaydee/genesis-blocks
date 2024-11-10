import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

config(); // Load environment variables from .env

// Define interfaces for our types
interface ContractFunction {
  contractName: string;
  functionName: string;
  functionType: string;
  functionCode: string;
}

interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: {
    contractName: string;
    functionName?: string;
    functionType?: string;
    functionCode: string;
  };
}

// Function to extract individual functions from a Clarity contract
function extractFunctionsFromContract(contractContent: string): ContractFunction[] {
  const functionRegex = /\(define-(public|private|read-only)\s+(\([^\)]+\)[^\)]*\))(?:[\s\S]*?)(?=\(define-|$)/g;
  const functions: ContractFunction[] = [];
  let match;

  while ((match = functionRegex.exec(contractContent)) !== null) {
    const funcType = match[1]; // public, private, or read-only
    const funcSignature = match[2]; // Function signature including parameters
    const funcBodyStartIndex = match.index + match[0].length;
    const nextFunctionIndex = contractContent.indexOf('(define-', funcBodyStartIndex);
    const funcBody = contractContent.substring(
      funcBodyStartIndex,
      nextFunctionIndex > -1 ? nextFunctionIndex : contractContent.length
    ).trim();

    // Extract function name from signature
    const nameMatch = /\((\w+)/.exec(funcSignature);
    const funcName = nameMatch ? nameMatch[1] : 'unknown';

    const funcCode = `(define-${funcType} ${funcSignature}\n${funcBody}\n)`;

    functions.push({
      contractName: '',
      functionName: funcName,
      functionType: funcType,
      functionCode: funcCode,
    });
  }

  return functions;
}

async function main() {
  // Step 1: Read and parse contracts to extract functions
  const contractsDir = path.resolve(__dirname, '../contracts');
  const files = fs.readdirSync(contractsDir).filter(file => file.endsWith('.clar'));

  const embeddingsArray: EmbeddingVector[] = [];

  // List of files to embed as whole documents
  const wholeFiles = ['token_swap.clar', 'staking_contract.clar'];

  for (const file of files) {
    const filePath = path.join(contractsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (wholeFiles.includes(file)) {
      // For specified files, embed the entire content
      const openAIEmbeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      try {
        const embedding = await openAIEmbeddings.embedQuery(content);
        embeddingsArray.push({
          id: file, // Use filename as ID
          values: embedding,
          metadata: {
            contractName: file,
            functionCode: content,
          },
        });
        console.log(`Embedded entire file: ${file}`);
      } catch (error) {
        console.error(`Error generating embedding for file ${file}:`, error);
      }
    } else {
      // For other files, extract functions and embed them individually
      const extractedFunctions = extractFunctionsFromContract(content);

      for (const func of extractedFunctions) {
        func.contractName = file; // Set the contract name
        const openAIEmbeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });

        try {
          const embedding = await openAIEmbeddings.embedQuery(func.functionCode);
          embeddingsArray.push({
            id: `${file}:${func.functionName}`, // Unique identifier
            values: embedding,
            metadata: {
              contractName: file,
              functionName: func.functionName,
              functionType: func.functionType,
              functionCode: func.functionCode,
            },
          });
        } catch (error) {
          console.error(
            `Error generating embedding for function ${func.functionName} in contract ${file}:`,
            error
          );
        }
      }
    }
  }

  console.log(`Generated embeddings for ${embeddingsArray.length} items.`);

  // Step 2: Initialize Pinecone Client
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    throw new Error('Pinecone environment variables are not set properly.');
  }

  const pinecone = new Pinecone({
    apiKey,
  });

  const index = pinecone.index(indexName);

  // Step 3: Upsert embeddings into Pinecone
  const batchSize = 100;
  for (let i = 0; i < embeddingsArray.length; i += batchSize) {
    const batch = embeddingsArray.slice(i, i + batchSize);
    try {
      await index.upsert(batch);
      console.log(`Upserted batch ${i / batchSize + 1}`);
    } catch (error) {
      console.error(`Error upserting batch ${i / batchSize + 1}:`, error);
    }
  }

  console.log('All embeddings upserted successfully.');
}

main().catch(err => {
  console.error('Error:', err);
});
