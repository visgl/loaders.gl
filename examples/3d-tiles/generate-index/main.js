import fs from 'fs';
import path from 'path';

function main({inputDir, outputFilePath}) {
  const indexMap = {};
  const categories = fs.readdirSync(inputDir);
  categories.forEach(cat => {
    const catDir = path.join(inputDir, cat);
    if (fs.lstatSync(catDir).isDirectory()) {
      const examples = fs.readdirSync(catDir);
      indexMap[cat] = {
        name: cat,
        path: catDir,
        examples: examples.reduce((resMap, e) => {
          const exampleDir = path.join(catDir, e);
          if (fs.lstatSync(exampleDir).isDirectory()) {
            const files = fs.readdirSync(exampleDir);
            resMap[e] = {
              name: e,
              path: exampleDir,
              files
            };
          }
          return resMap;
        }, {})
      };
    }
  });

  fs.writeFileSync(outputFilePath, JSON.stringify(indexMap, null, 2));
}

module.exports = main;
