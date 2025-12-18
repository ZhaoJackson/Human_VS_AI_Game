import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('./src/features/game/data/Turing Test Data - Coded.xlsx');

// Get the first two sheets (Real and AI)
const realSheetName = workbook.SheetNames[0];
const aiSheetName = workbook.SheetNames[1];

const realSheet = workbook.Sheets[realSheetName];
const aiSheet = workbook.Sheets[aiSheetName];

// Convert sheets to JSON
const realData = XLSX.utils.sheet_to_json(realSheet);
const aiData = XLSX.utils.sheet_to_json(aiSheet);

console.log(`\nTotal Real responses: ${realData.length}`);
console.log(`Total AI responses: ${aiData.length}`);

// Filter Real data where consentGiven = 'Y'
const filteredReal = realData.filter(row => row.consentGiven === 'Y');
console.log(`Filtered Real responses (consent = Y): ${filteredReal.length}`);

// Create a map of AI responses by Family + primaryCategory + promptCategory
const aiMap = new Map();
aiData.forEach(ai => {
  const key = `${ai.Family}|${ai.primaryCategory}|${ai.promptCategory}`;
  if (!aiMap.has(key)) {
    aiMap.set(key, []);
  }
  aiMap.get(key).push(ai);
});

// Generate the converted data
const convertedData = [];
let unmatchedCount = 0;

filteredReal.forEach(human => {
  const key = `${human.Family}|${human.primaryCategory}|${human.promptCategory}`;
  const matchingAIs = aiMap.get(key);
  
  if (matchingAIs && matchingAIs.length > 0) {
    // Use the first matching AI response
    const ai = matchingAIs[0];
    
    // Generate ID (format: XXX.XXX.XXX.XXXXXXXXXX)
    // Using a simple hash-like ID based on the data
    const idParts = [
      '010', // Fixed prefix for mental health
      String(human.id).padStart(3, '0'),
      String(ai.id).padStart(3, '0'),
      Date.now().toString().slice(-10)
    ];
    const id = idParts.join('.');
    
    // Process tags - split by comma and trim
    let tags = [];
    if (human.TextTags) {
      tags = human.TextTags.split(',').map(tag => tag.trim());
    }
    
    // Use TextHumanFinal if available, otherwise TextHumanOriginal
    const humanText = human.TextHumanFinal || human.TextHumanOriginal;
    
    // Create the entry
    const entry = {
      id: id,
      theme: human.Family,
      condition: human.primaryCategory,
      type: human.promptCategory,
      prompt: human.promptOriginal, // Use the original human prompt as the main prompt
      human: humanText,
      ai: ai.TextAI,
      tags: tags
    };
    
    convertedData.push(entry);
  } else {
    unmatchedCount++;
    console.log(`\nNo matching AI response for: ${human.Family} / ${human.primaryCategory} / ${human.promptCategory}`);
  }
});

console.log(`\n✓ Successfully matched: ${convertedData.length} entries`);
console.log(`✗ Unmatched: ${unmatchedCount} entries`);

// Generate the JavaScript file content
const jsContent = `export const data = ${JSON.stringify(convertedData, null, 2)};`;

// Write to the output file
fs.writeFileSync('./src/features/game/data/turing_data_test.js', jsContent);

console.log(`\n✓ File created: src/features/game/data/turing_data_test.js`);
console.log(`\n=== SAMPLE ENTRIES ===`);
console.log(JSON.stringify(convertedData.slice(0, 2), null, 2));

// Generate a summary report
const summary = {
  totalRealResponses: realData.length,
  consentedResponses: filteredReal.length,
  totalAIResponses: aiData.length,
  matchedPairs: convertedData.length,
  unmatchedReal: unmatchedCount,
  themes: [...new Set(convertedData.map(d => d.theme))],
  conditions: [...new Set(convertedData.map(d => d.condition))],
  types: [...new Set(convertedData.map(d => d.type))]
};

fs.writeFileSync('./conversion-summary.json', JSON.stringify(summary, null, 2));
console.log(`\n✓ Summary report saved to: conversion-summary.json`);
