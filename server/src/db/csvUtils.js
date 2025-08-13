const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, 'csv');

// Simple CSV parser - converts CSV to array of objects
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Handle special data types
      if (value === 'null') {
        value = null;
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value && value.startsWith('[') && value.endsWith(']')) {
        // Parse JSON arrays
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if JSON parsing fails
        }
      } else if (value && !isNaN(value) && !isNaN(parseFloat(value))) {
        // Parse numbers
        value = parseFloat(value);
      } else if (value && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        // Parse ISO dates
        value = new Date(value);
      }
      
      row[header] = value;
    });
    data.push(row);
  }
  
  return data;
}

// Parse a single CSV line, handling quoted values properly
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes ("" inside quoted field)
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        if (!inQuotes && current.length === 0) {
          // This was an empty quoted field
          current = '';
        }
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  return result;
}

// Convert array of objects to CSV string
function objectsToCSV(objects) {
  if (!objects || objects.length === 0) return '';
  
  const headers = Object.keys(objects[0]);
  const csvRows = [headers.join(',')];
  
  objects.forEach(obj => {
    const values = headers.map(header => {
      let value = obj[header];
      
      if (value === null || value === undefined) {
        return 'null';
      } else if (typeof value === 'object') {
        // JSON stringify and quote objects since they often contain commas
        const jsonStr = JSON.stringify(value);
        return `"${jsonStr.replace(/"/g, '""')}"`;
      } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return String(value);
    });
    
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

// Read CSV file and return array of objects
function readCSV(filename) {
  try {
    const filePath = path.join(CSV_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return parseCSV(content);
  } catch (error) {
    console.error(`Error reading CSV file ${filename}:`, error);
    return [];
  }
}

// Write array of objects to CSV file
function writeCSV(filename, data) {
  try {
    const filePath = path.join(CSV_DIR, filename);
    const csvContent = objectsToCSV(data);
    // Ensure the CSV ends with a newline for proper parsing
    const finalContent = csvContent.endsWith('\n') ? csvContent : csvContent + '\n';
    fs.writeFileSync(filePath, finalContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing CSV file ${filename}:`, error);
    return false;
  }
}

// Generate UUID for new records
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

module.exports = {
  parseCSV,
  objectsToCSV,
  readCSV,
  writeCSV,
  generateId
};