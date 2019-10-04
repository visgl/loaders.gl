#/bin/sh

echo '# Minified Scripts'
find modules -name dist.min.js | while read file; do
    ls -S -lh "$file" | grep -v node_modules | awk '{print $9, $5}' | sort
done

echo '# Worker sizes'
find modules -name "*-loader.worker.js" | grep -v src | while read file; do
    ls -S -lh "$file" | grep -v test | awk '{print $9, $5}'
done