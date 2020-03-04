import { ReadableStream } from 'web-streams-polyfill/ponyfill'

import { ReadableStreamBuffer } from 'stream-buffers'

import { Readable } from 'stream'

export function arrayToStream (array: ArrayBuffer) {
    const myReadableStreamBuffer = new ReadableStreamBuffer({
        frequency: 10,   // in milliseconds.
        chunkSize: 2048  // in bytes.
    })

    myReadableStreamBuffer.put(Buffer.from(array))
    myReadableStreamBuffer.stop()

    const webReader = nodeToWeb(myReadableStreamBuffer)

    return webReader
}

export async function takeAsync(asyncIterable: AsyncIterable<any>, count = Infinity) {
  const result = [];
  const iterator = asyncIterable[Symbol.asyncIterator]()
  while (result.length < count) {
    const { value, done } = await iterator.next()
    if (done)
      break
    result.push(value)
  }
  return result
}

function nodeToWeb(nodeStream: Readable) {
    var destroyed = false
    var listeners = {}

    function start (controller: ReadableStreamDefaultController) {
      listeners['data'] = onData
      listeners['end'] = onData
      listeners['end'] = onDestroy
      listeners['close'] = onDestroy
      listeners['error'] = onDestroy
      for (var name in listeners)
        nodeStream.on(name, listeners[name])

      nodeStream.pause()

      function onData(chunk: Buffer) {
        if (destroyed)
          return
        controller.enqueue(chunk)
        nodeStream.pause()
      }

      function onDestroy(err: Error) {
        if (destroyed)
          return
        destroyed = true

        for (var name in listeners)
          nodeStream.removeListener(name, listeners[name])

        if (err) controller.error(err)
        else controller.close()
      }
    }

    function pull() {
      if (destroyed)
        return
      nodeStream.resume()
    }

    function cancel() {
      destroyed = true

      for (var name in listeners)
        nodeStream.removeListener(name, listeners[name])

      nodeStream.push(null)
      nodeStream.pause()
      nodeStream.destroy()
    }

    return new ReadableStream({ start: start, pull: pull, cancel: cancel })
  }
