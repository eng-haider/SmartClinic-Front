// Retries for requests that fail for a reason that usually clears up by
// itself: the clinic database is briefly out of connections (503), a gateway
// hiccup (502 / 504), rate limiting (429), or a dropped connection.

const TRANSIENT_STATUSES = new Set([429, 502, 503, 504])

export function isTransientError (err) {
  if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return false
  const status = err?.response?.status
  if (status) return TRANSIENT_STATUSES.has(status)
  // No response at all: the connection dropped before the server answered.
  return err?.isAxiosError === true
}

/**
 * Run `request`, retrying transient failures after growing, jittered waits
 * (about 0.5 s, 1 s, 2 s, 4 s). Any other error, or the last failure, is thrown.
 */
export async function withRetry (request, { attempts = 5, baseDelay = 500, signal } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request()
    } catch (err) {
      if (attempt >= attempts || signal?.aborted || !isTransientError(err)) throw err
      await wait(baseDelay * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5), signal)
    }
  }
}

function wait (ms, signal) {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
