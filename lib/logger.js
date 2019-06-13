
const { red, blue, bold } = require('colorette')
const { createLogger, format, transports } = require('winston')

const SERVICES = {
  undefined: { clean: 'devl', colored: bold('devl') },
  mhub: { clean: 'mhub', colored: blue('mhub') },
  primary: { clean: 'main', colored: bold(red('main')) }
}

const coloredFormat = format.printf(record => {
  const { service, message } = record
  return `[${SERVICES[service].colored}] ${message}`
})

const noColorFormat = format.printf(record => {
  const { service, message } = record
  return `[${SERVICES[service].clean}] ${message}`
})

exports.createLogger = options => {
  return createLogger({
    level: options.logLevel,
    format: options.noColor ? noColorFormat : coloredFormat,
    transports: [
      new transports.Console()
    ]
  })
}
