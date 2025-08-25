const fs = require('fs');

const content = fs.readFileSync('./index.js', 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let openParens = 0;
let openBrackets = 0;
let inString = false;
let stringChar = null;
let inTemplate = false;

console.log('Checking brackets in index.js...\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let escaped = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j-1] : '';
    
    // Handle escape sequences
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    // Handle strings and templates
    if (!inString && !inTemplate) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        continue;
      }
      if (char === '`') {
        inTemplate = true;
        continue;
      }
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = null;
      continue;
    } else if (inTemplate && char === '`') {
      inTemplate = false;
      continue;
    }
    
    // Count brackets only outside strings
    if (!inString && !inTemplate) {
      if (char === '{') openBraces++;
      if (char === '}') {
        openBraces--;
        if (openBraces < 0) {
          console.log(`ERROR: Extra closing brace } at line ${i + 1}`);
        }
      }
      if (char === '(') openParens++;
      if (char === ')') {
        openParens--;
        if (openParens < 0) {
          console.log(`ERROR: Extra closing paren ) at line ${i + 1}`);
        }
      }
      if (char === '[') openBrackets++;
      if (char === ']') {
        openBrackets--;
        if (openBrackets < 0) {
          console.log(`ERROR: Extra closing bracket ] at line ${i + 1}`);
        }
      }
    }
  }
  
  // Log status every 500 lines
  if ((i + 1) % 500 === 0) {
    console.log(`Line ${i + 1}: Braces=${openBraces}, Parens=${openParens}, Brackets=${openBrackets}`);
  }
}

console.log('\n=== FINAL COUNT ===');
console.log(`Open braces {: ${openBraces}`);
console.log(`Open parens (: ${openParens}`);
console.log(`Open brackets [: ${openBrackets}`);
console.log(`Still in string: ${inString}`);
console.log(`Still in template: ${inTemplate}`);

if (openBraces > 0) console.log(`\n❌ Missing ${openBraces} closing brace(s) }`);
if (openParens > 0) console.log(`❌ Missing ${openParens} closing paren(s) )`);
if (openBrackets > 0) console.log(`❌ Missing ${openBrackets} closing bracket(s) ]`);

if (openBraces === 0 && openParens === 0 && openBrackets === 0 && !inString && !inTemplate) {
  console.log('\n✅ All brackets are balanced!');
} else {
  console.log('\n❌ Bracket imbalance detected!');
  console.log('The file ends at line', lines.length);
}
