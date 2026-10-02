if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function () {
    let resolve
    let reject
    const promise = new Promise((a, b) => {
      resolve = a
      reject = b
    })
    return { promise, resolve, reject }
  }
}

const proto = ArrayBuffer.prototype
if (typeof proto.transferToFixedLength !== 'function') {
  proto.transferToFixedLength = function (n = this.byteLength) {
    const out = new ArrayBuffer(n)
    new Uint8Array(out).set(new Uint8Array(this, 0, Math.min(n, this.byteLength)))
    return out
  }
}
if (typeof proto.transfer !== 'function') {
  proto.transfer = proto.transferToFixedLength
}
if (typeof Response !== 'undefined' && typeof Response.prototype.bytes !== 'function') {
  Response.prototype.bytes = async function () {
    return new Uint8Array(await this.arrayBuffer())
  }
}
if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype.values = function ({ preventCancel = false } = {}) {
    const reader = this.getReader()
    return {
      async next() {
        const r = await reader.read()
        if (r.done) reader.releaseLock()
        return r
      },
      async return(value) {
        if (!preventCancel) await reader.cancel(value)
        reader.releaseLock()
        return { done: true, value }
      },
      [Symbol.asyncIterator]() {
        return this
      }
    }
  }
  ReadableStream.prototype[Symbol.asyncIterator] = ReadableStream.prototype.values
}
