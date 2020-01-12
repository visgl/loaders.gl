#/bin/sh

echo '# Minified Scripts'
find modules -name dist.min.js | sort | while read file; do
    ls -S -lh "$file" | grep -v node_modules | awk '{print $9, $5}'
done

echo '# Worker sizes'
find modules -name "*-loader.worker.js" | sort | grep -v 'src\|esm\|es5\|es6' | while read file; do
    ls -S -lh "$file" | grep -v test | awk '{print $9, $5}'
done