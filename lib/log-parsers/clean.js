
const END_OF_LINE_REGEX = /\r?\n/g

exports.cleanParser = (logger, { error = false } = {}) => {
  const logLevel = error ? 'info' : 'error'

  return data => {
    data.toString().split(END_OF_LINE_REGEX).forEach(line => {
      if (line.trim()) {
        logger[logLevel](line)
      }
    })
  }
}
