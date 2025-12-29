import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex para encontrar imports/exports sem extensão .js
  // Não adiciona .js se já tiver extensão ou se for node_modules
  const regex = /from\s+['"](\.[^'"]+)(?<!\.js)(?<!\.json)['"];/g;
  
  content = content.replace(regex, (match, importPath) => {
    return `from "${importPath}.js";`;
  });
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  });
}

walkDir(distDir);
console.log('✓ Imports fixados com extensões .js');
