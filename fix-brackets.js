const fs = require('fs');

// Read your index.js file
const content = fs.readFileSync('./index.js', 'utf8');
const lines = content.split('\n');

// Track all opening and closing brackets
let stack = [];
let issues = [];

const pairs = {
  '{': '}',
  '(': ')',
  '[': ']'
};

// Process each line
for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  const line = lines[lineNum];
  let inString = false;
  let stringChar = null;
  let inTemplate = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i-1] : '';
    
    // Skip escaped characters
    if (prevChar === '\\') continue;
    
    // Handle strings
    if (!inString && !inTemplate && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      continue;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      continue;
    }
    
    // Handle template literals
    if (!inString && !inTemplate && char === '`') {
      inTemplate = true;
      continue;
    } else if (inTemplate && char === '`' && prevChar !== '\\') {
      inTemplate = false;
      continue;
    }
    
    // Only process brackets outside of strings
    if (!inString && !inTemplate) {
      if (char === '{' || char === '(' || char === '[') {
        stack.push({
          char: char,
          line: lineNum + 1,
          col: i + 1
        });
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          issues.push(`Line ${lineNum + 1}: Unexpected closing ${char}`);
        } else {
          const last = stack[stack.length - 1];
          const expected = pairs[last.char];
          if (char !== expected) {
            issues.push(`Line ${lineNum + 1}: Expected ${expected} but found ${char} (opened at line ${last.line})`);
          } else {
            stack.pop();
          }
        }
      }
    }
  }
}

// Report results
console.log('=== BRACKET ANALYSIS ===\n');

if (stack.length > 0) {
  console.log('❌ UNCLOSED BRACKETS:');
  stack.forEach(item => {
    console.log(`   Line ${item.line}, Col ${item.col}: Unclosed ${item.char} needs ${pairs[item.char]}`);
  });
  console.log('\n');
}

if (issues.length > 0) {
  console.log('❌ BRACKET MISMATCHES:');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n');
}

if (stack.length === 0 && issues.length === 0) {
  console.log('✅ All brackets appear to be balanced!\n');
  console.log('The syntax error might be from:');
  console.log('- An incomplete statement');
  console.log('- A missing semicolon in a required place');
  console.log('- An unclosed template literal');
} else {
  console.log('TO FIX:');
  if (stack.length > 0) {
    const last = stack[stack.length - 1];
    console.log(`Add ${pairs[last.char]} after line ${last.line} or at the end of the file`);
  }
}

console.log(`\nFile has ${lines.length} total lines`);
