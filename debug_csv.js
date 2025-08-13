const fs = require('fs');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        if (!inQuotes && current.length === 0) {
          current = '';
        }
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

const content = fs.readFileSync('/Users/Coezy/Desktop/Turnship_v5/server/src/db/csv/connections.csv', 'utf8');
const lines = content.trim().split('\n');

console.log('Header fields:', lines[0].split(',').length);
console.log('Header:', lines[0].split(','));
console.log('');
console.log('Last line original field count:', lines[lines.length - 1].split(',').length);
console.log('Last line parsed field count:', parseCSVLine(lines[lines.length - 1]).length);
console.log('Last line parsed fields:');
console.log(parseCSVLine(lines[lines.length - 1]));