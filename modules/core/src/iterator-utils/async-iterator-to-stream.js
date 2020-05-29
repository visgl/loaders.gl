const {Readable} = require('readable-stream');

function getSymbol(name) {
  if (typeof Symbol === 'function') {
    const symbol = Symbol[name];
    return symbol !== undefined ? symbol : `@@${name}`;
  }
  return `@@${name}`;
}

const $$asyncIterator = getSymbol('asyncIterator');
const $$iterator = getSymbol('iterator');

function resolveToIterator(value) {
  let generator;
  if (typeof (generator = value[$$asyncIterator]) === 'function') {
    return generator.call(value); // async iterable
  }
  if (typeof (generator = value[$$iterator]) === 'function') {
    return generator.call(value); // iterable
  }
  return value; // iterator
};

// Create a readable stream from a sync/async iterator
//
// If a generator is passed instead of an iterator, a factory is returned
// instead of a plain readable stream.
//
// The generator can be async or can yield promises to wait for them.
//
// `yield` returns the `size` parameter of the next method, the generator can
// ask for it without generating a value by yielding `undefined`.
export function asyncIteratorToStream(iterable, options) {
  if (typeof iterable === 'function') {
    return function() {
      return asyncIteratorToStream(iterable.apply(this, arguments), options);
    };
  }

  const {then} = iterable;
  if (typeof then === 'function') {
    return then.call(iterable, iterable => asyncIteratorToStream(iterable, options));
  }

  const iterator = resolveToIterator(iterable);
  const isGenerator = 'return' in iterator;
  const readable = options instanceof Readable ? options : new Readable(options);
  if (isGenerator) {
    readable._destroy = async (error, cb) => {
      try {
        await (error != null ? iterator.throw(error) : iterator.return());
      } catch (error) {
        return cb(error);
      }
      cb(error);
    };
  }
  let running = false;
  readable._read = async size => {
    if (running) {
      return;
    }
    running = true;
    try {
      let value;
      do {
        let cursor = iterator.next(size);

        // return the next value of the iterator but if it is a promise, resolve it and
        // reinject it
        //
        // this enables the use of a simple generator instead of an async generator
        // (which are less widely supported)
        if (typeof cursor.then === 'function') {
          cursor = await cursor;
        } else {
          while (
            !cursor.done &&
            (value = cursor.value) != null &&
            typeof value.then === 'function'
          ) {
            try {
              value = await value;
            } catch (error) {
              cursor = iterator.throw(error);
              continue;
            }
            cursor = iterator.next(value);
          }
        }

        if (cursor.done) {
          return readable.push(null);
        }
        value = cursor.value;
      } while (value === undefined || readable.push(value));
    } catch (error) {
      process.nextTick(readable.emit.bind(readable, 'error', error));
    } finally {
      running = false;
    }
  };
  return readable;
}

asyncIteratorToStream.obj = (iterable, options) =>
  asyncIteratorToStream(iterable, {
    objectMode: true,
    ...options
  });
