const fs = require('fs');

let content = fs.readFileSync('main.cjs', 'utf8');

// Find the problematic getLoadingPage function and fix its template literal
the functionRegex = /function getLoadingPageHTML\(message = '([^']+)'\)(?:\s*\?)?\s*\n\s*return\s*`([^`]*`)/g;

function escapeTemplate(template) {
  return template.replace(/`/g, '\\\`')
                   .replace(/\${/g, '\\\${')
                   .replace(/}/g, '\\}');
}

let match;
let totalFixed = 0;

while ((match = functionRegex.exec(content)) !== null) {
  const messageParam = match[1];
  let template = match[2];
  
  // Skip very short templates
  if (template.length < 100) continue;
  
  // Escape problematic characters in the template
  const escapedTemplate = escapeTemplate(template);
  
  // Build the fixed function
  const fixedFunction = `function getLoadingPageHTML(message = '${messageParam}') {
  return '\\${escapedTemplate}';\n}`;
  
  // Replace the old one with the new one
  content = content.substring(0, match.index) + fixedFunction + content.substring(functionRegex.lastIndex);
  
  totalFixed++;
  console.log(`Fixed template literal at position ${match.index}, length: ${template.length}`);
}

if (totalFixed === 0) {
  console.log('No template literal issues found');
} else {
  console.log(`Total fixed: ${totalFixed} template literals`);
}

fs.writeFileSync('main.cjs', content, 'utf8');
console.log('Done');
