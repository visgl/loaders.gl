import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../../../');

function main({root, inputDir, outputFilePath}) {
  const indexMap = {};
  const categories = fs.readdirSync(inputDir);
  categories.forEach((cat) => {
    const catDir = path.resolve(inputDir, cat);
    if (fs.lstatSync(catDir).isDirectory()) {
      const examples = fs.readdirSync(catDir);
      indexMap[cat] = {
        name: cat,
        path: catDir.replace(ROOT_DIR, '.'),
        examples: examples.reduce((resMap, e) => {
          const exampleDir = path.join(catDir, e);
          if (fs.lstatSync(exampleDir).isDirectory()) {
            const files = fs.readdirSync(exampleDir);
            const tilesetIndex = files.findIndex((f) => f === 'tileset.json');

            let tileset = null;
            if (tilesetIndex !== -1) {
              tileset = files[tilesetIndex];
              files.splice(tilesetIndex, 1);
            }

            resMap[e] = {
              name: e,
              path: exampleDir.replace(ROOT_DIR, '.'),
              tileset,
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
