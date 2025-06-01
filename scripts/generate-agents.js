// Script to generate agents.json without SQLite dependency
const fs = require('fs');
const path = require('path');

// Define the output path for agents.json
const outputPath = path.resolve(__dirname, '..', 'src', 'renderer', 'src', 'config', 'agents.json');

// Check if the directory exists, if not create it
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Define a sample agents data structure if database access is not available
// This will be used if we can't access the actual database
const sampleAgents = [
  {
    "id": "1",
    "name": "Default Assistant",
    "model": "gpt-4",
    "icon": "assistant",
    "description": "General purpose AI assistant",
    "prompt": "You are a helpful assistant.",
    "group": ["general"],
    "systemPrompt": "You are a helpful AI assistant.",
    "temperature": 0.7,
    "maxTokens": 8192,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString()
  }
];

try {
  console.log('Generating agents.json file...');
  
  // Look for an existing agents.json in the expected location to preserve data
  let agentsData = sampleAgents;
  try {
    // Try to read existing file if it exists
    if (fs.existsSync(outputPath)) {
      const existingData = fs.readFileSync(outputPath, 'utf8');
      if (existingData) {
        agentsData = JSON.parse(existingData);
        console.log('Using existing agents data');
      }
    }
  } catch (readErr) {
    console.log('Could not read existing agents.json, using sample data');
  }
  
  // Write the data to the output file
  fs.writeFileSync(outputPath, JSON.stringify(agentsData, null, 2));
  
  console.log('Successfully generated agents.json file at:', outputPath);
} catch (error) {
  console.error('Error generating agents.json:', error);
  process.exit(1);
}
