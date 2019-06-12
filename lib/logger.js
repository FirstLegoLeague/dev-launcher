
const { red, blue, bold } = require('colorette')
const { createLogger, format, transports } = require('winston')

const SERVICES = {
  undefined: { colored: bold('devl') },
  mhub: { colored: blue('mhub') },
  primary: { colored: bold(red('main')) }
}

const devlFormat = format.printf(record => {
  const { service, message } = record
  return `[${SERVICES[service].colored}] ${message}`
})

exports.logger = createLogger({
  level: 'info',
  format: devlFormat,
  transports: [
    new transports.Console()
  ]
})
