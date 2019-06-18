
const END_OF_LINE_REGEX = /\r?\n/g

exports.clean = (logger, { error = false } = {}) => {
  const logLevel = error ? 'info' : 'error'

  return data => {
    data.toString().split(END_OF_LINE_REGEX).forEach(line => {
      if (line.trim()) {
        logger[logLevel](line)
      }
    })
  }
}

exports.json = logger => {
  return data => {
    try {
      const record = JSON.parse(data)
      logger[record.level.trim()](record.message)
    } catch (e) {
      logger.error(`can't parse log from main module: ${data.toString().trim()}`)
    }
  }
}
