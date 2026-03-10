import { Pipeline } from './pipeline';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file if it exists
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is missing.');
  console.error('Please set it via export GEMINI_API_KEY="your_api_key", or in a .env file.');
  process.exit(1);
}

const inputFolder = process.argv[2] || 'input';
const outputFolder = process.argv[3] || 'slides';

const orchestrator = new Pipeline(apiKey);

orchestrator.run(inputFolder, outputFolder)
  .then(() => {
    console.log('Finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Pipeline failed with error:', err);
    process.exit(1);
  });
