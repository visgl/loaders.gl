/* eslint-disable */
import fs from 'fs';
import path from 'path';
import util from 'util';

// eslint-disable-next-line max-statements, complexity
export default async function extractZip(zipStream, entry, outPath) {
  let entryName = entry || '';
  if (typeof entry === 'string') {
    entry = zipStream.entry(entry);
    if (entry) {
      entryName = entry.name;
    } else if (entryName.length && entryName[entryName.length - 1] !== '/') entryName += '/';
  }

  if (!entry || entry.isDirectory) {
    const files = [];
    const dirs = [];
    const allDirs = {};
    for (const e in zipStream._entries) {
      if (
        Object.prototype.hasOwnProperty.call(zipStream._entries, e) &&
        e.lastIndexOf(entryName, 0) === 0
      ) {
        let relPath = e.replace(entryName, '');
        const childEntry = zipStream._entries[e];
        if (childEntry.isFile) {
          files.push(childEntry);
          relPath = path.dirname(relPath);
        }
        if (relPath && !allDirs[relPath] && relPath !== '.') {
          allDirs[relPath] = true;
          let parts = relPath.split('/').filter(f => f);
          if (parts.length) {
            dirs.push(parts);
          }
          while (parts.length > 1) {
            parts = parts.slice(0, parts.length - 1);
            const partsPath = parts.join('/');
            if (allDirs[partsPath] || partsPath === '.') {
              break;
            }
            allDirs[partsPath] = true;
            dirs.push(parts);
          }
        }
      }
    }

    dirs.sort((x, y) => x.length - y.length);
    if (dirs.length) {
      await createDirectories(outPath, dirs);
      await extractFiles(outPath, entryName, files, 0);
    } else {
      await extractFiles(outPath, entryName, files, 0);
    }
  } else {
    const fsStat = util.promisify(fs.stat);
    const stat = await fsStat(outPath);
    if (stat && stat.isDirectory()) {
      await _extract(entry, path.join(outPath, path.basename(entry.name)));
    } else {
      await _extract(entry, outPath);
    }
  }
}

async function createDirectories(baseDir, dirs) {
  if (!dirs.length) {
    return;
  }
  let dir = dirs.shift();
  dir = path.join(baseDir, path.join.apply(path, dir));

  const mkdir = util.promisify(fs.mkdir);
  try {
    await mkdir(dir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  await createDirectories(baseDir, dirs);
}

async function extractFiles(baseDir, baseRelPath, files, callback, extractedCount) {
  if (!files.length) return callback(null, extractedCount);
  const file = files.shift();
  const targetPath = path.join(baseDir, file.name.replace(baseRelPath, ''));
  this.extract(file, targetPath, err => {
    if (err) return callback(err, extractedCount);
    extractFiles(baseDir, baseRelPath, files, callback, extractedCount + 1);
  });
}

async function _extract(entry, outPath, callback) {
  this.stream(entry, (err, stm) => {
    if (err) {
      callback(err);
    } else {
      let errThrown;
      let fsStm;
      stm.on('error', err => {
        errThrown = err;
        if (fsStm) {
          stm.unpipe(fsStm);
          fsStm.close(() => {
            callback(err);
          });
        }
      });
      fs.open(outPath, 'w', (err, fdFile) => {
        if (err) return callback(err || errThrown);
        if (errThrown) {
          fs.close(this.fd, () => {
            callback(errThrown);
          });
          return;
        }
        fsStm = fs.createWriteStream(outPath, {fd: fdFile});
        fsStm.on('finish', () => {
          this.emit('extract', entry, outPath);
          if (!errThrown) callback();
        });
        stm.pipe(fsStm);
      });
    }
  });
}
