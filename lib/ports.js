
const Promise = require('bluebird')
const net = require('net')

const MIN_PORT = 2 ** 14
const MAX_PORT = 2 ** 16

const RETRIES = 10

const randint = (a, b) => Math.floor(a + Math.random() * (b - a))

exports.findPort = () => {
  function findPortWithRetry (leftRetries) {
    const randomPort = randint(MIN_PORT, MAX_PORT)

    return new Promise((resolve, reject) => {
      const server = net.createServer(() => {})

      server.listen(randomPort)

      server.on('error', reject)
      server.on('listening', () => {
        server.close()
        resolve()
      })
    })
      .return(randomPort)
      .catch(() => {
        if (leftRetries > 0) {
          return findPortWithRetry(leftRetries - 1)
        } else {
          throw new Error(`Can't find port after ${RETRIES} retries`)
        }
      })
  }

  return findPortWithRetry(RETRIES)
}
