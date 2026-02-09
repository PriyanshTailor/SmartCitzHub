import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/transit-data.json');

// Read file as buffer to check for BOM
const buffer = fs.readFileSync(dataPath);
let content = buffer.toString('utf-8');

// Remove BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

// Try to parse and reformat
try {
  const data = JSON.parse(content);
  const cleanJson = JSON.stringify(data, null, 2);
  
  // Write as UTF-8 without BOM
  fs.writeFileSync(dataPath, cleanJson, 'utf8');
  console.log('✅ JSON file cleaned and validated');
  console.log('Vehicles:', data.vehicles.length);
  console.log('Alerts:', data.alerts.length);
  console.log('Routes:', data.routes.length);
} catch (e) {
  console.error('❌ Error processing JSON:', e.message);
  process.exit(1);
}
