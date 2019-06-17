
exports.jsonParser = logger => {
  return data => {
    try {
      const record = JSON.parse(data)
      logger[record.level.trim()](record.message)
    } catch (e) {
      logger.error(`can't parse log from main module: ${data.toString().trim()}`)
    }
  }
}
