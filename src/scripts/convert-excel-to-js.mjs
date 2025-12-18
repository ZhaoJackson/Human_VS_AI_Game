import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('./src/features/game/data/Turing Test Data - Coded.xlsx');

const realSheetName = workbook.SheetNames[0];
const aiSheetName = workbook.SheetNames[1];

const realSheet = workbook.Sheets[realSheetName];
const aiSheet = workbook.Sheets[aiSheetName];

const realData = XLSX.utils.sheet_to_json(realSheet);
const aiData = XLSX.utils.sheet_to_json(aiSheet);

console.log('\n=== REAL TAB (Human Responses) ===');
console.log(`Total rows: ${realData.length}`);
console.log('First row sample:', realData[0]);
console.log('\nColumn names:');
if (realData.length > 0) {
  console.log(Object.keys(realData[0]));
}

console.log('\n=== AI TAB (AI Responses) ===');
console.log(`Total rows: ${aiData.length}`);
console.log('First row sample:', aiData[0]);
console.log('\nColumn names:');
if (aiData.length > 0) {
  console.log(Object.keys(aiData[0]));
}

console.log('\n=== FILTERED DATA (Consent = Y) ===');
const filteredReal = realData.filter(row => {
  const consentKey = Object.keys(row).find(key => key.includes('Consent') || key === 'K' || key.includes('consent'));
  return consentKey && row[consentKey] === 'Y';
});
console.log(`Filtered real responses: ${filteredReal.length}`);

fs.writeFileSync('./real_data_sample.json', JSON.stringify(realData.slice(0, 5), null, 2));
fs.writeFileSync('./ai_data_sample.json', JSON.stringify(aiData.slice(0, 5), null, 2));
fs.writeFileSync('./filtered_real_sample.json', JSON.stringify(filteredReal.slice(0, 5), null, 2));

console.log('\n✓ Sample data saved to JSON files for inspection');
