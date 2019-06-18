
const END_OF_LINE_REGEX = /\r?\n/g

exports.custom = func => {
  return data => {
    data.toString().split(END_OF_LINE_REGEX).forEach(line => {
      if (line.trim()) {
        func(line)
      }
    })
  }
}

exports.json = logger => {
  return data => {
    data.toString().split(END_OF_LINE_REGEX)
      .map(s => s.trim())
      .filter(s => s)
      .forEach(line => {
        try {
          const record = JSON.parse(line)
          logger.log(record.level.trim(), record.message)
        } catch (e) {
          logger.error(`can't parse log from main module: ${line.toString().trim()}`)
        }
      })
  }
}
