const fs = require('fs');
const path = require('path');

function walkDir(dir, ext, cb) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkDir(full, ext, cb);
    else if (f.endsWith(ext)) cb(full);
  });
}

let fixed = 0;
const dirs = ['app', 'components'];
for (const d of dirs) {
  walkDir(d, '.tsx', file => {
    let c = fs.readFileSync(file, 'utf8');
    const outfit = "var(--font-outfit)";
    const inter  = "var(--font-inter)";
    const changed = c
      .split("'" + outfit + "'").join("\"'Outfit', sans-serif\"")
      .split('"' + outfit + '"').join("\"'Outfit', sans-serif\"")
      .split("'" + inter + "'").join("\"'Inter', sans-serif\"")
      .split('"' + inter + '"').join("\"'Inter', sans-serif\"");
    if (changed !== c) {
      fs.writeFileSync(file, changed);
      fixed++;
      console.log('Fixed:', file);
    }
  });
}
console.log('Total files fixed:', fixed);
