import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('./src/features/game/data/Turing Test Data - Coded.xlsx');

const realSheetName = workbook.SheetNames[0];
const aiSheetName = workbook.SheetNames[1];

const realSheet = workbook.Sheets[realSheetName];
const aiSheet = workbook.Sheets[aiSheetName];

const realData = XLSX.utils.sheet_to_json(realSheet);
const aiData = XLSX.utils.sheet_to_json(aiSheet);

console.log(`\nTotal Real responses: ${realData.length}`);
console.log(`Total AI responses: ${aiData.length}`);

const filteredReal = realData.filter(row => row.consentGiven === 'Y');
console.log(`Filtered Real responses (consent = Y): ${filteredReal.length}`);

const aiMap = new Map();
aiData.forEach(ai => {
  const key = `${ai.Family}|${ai.primaryCategory}|${ai.promptCategory}`;
  if (!aiMap.has(key)) {
    aiMap.set(key, []);
  }
  aiMap.get(key).push(ai);
});

const convertedData = [];
let unmatchedCount = 0;

filteredReal.forEach(human => {
  const key = `${human.Family}|${human.primaryCategory}|${human.promptCategory}`;
  const matchingAIs = aiMap.get(key);
  
  if (matchingAIs && matchingAIs.length > 0) {
    const ai = matchingAIs[0];
    
    const idParts = [
      '010',
      String(human.id).padStart(3, '0'),
      String(ai.id).padStart(3, '0'),
      Date.now().toString().slice(-10)
    ];
    const id = idParts.join('.');
    
    let tags = [];
    if (human.TextTags) {
      tags = human.TextTags.split(',').map(tag => tag.trim());
    }
    
    const humanText = human.TextHumanFinal || human.TextHumanOriginal;
    
    const entry = {
      id: id,
      theme: human.Family,
      condition: human.primaryCategory,
      type: human.promptCategory,
      prompt: human.promptOriginal,
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

const jsContent = `export const data = ${JSON.stringify(convertedData, null, 2)};`;

fs.writeFileSync('./src/features/game/data/turing_data_test.js', jsContent);

console.log(`\n✓ File created: src/features/game/data/turing_data_test.js`);
console.log(`\n=== SAMPLE ENTRIES ===`);
console.log(JSON.stringify(convertedData.slice(0, 2), null, 2));

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
console.log(`Summary report saved to: conversion-summary.json`);
