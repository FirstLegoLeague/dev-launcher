
const { yellow, blue, green, bold } = require('colorette')
const { createLogger, format, transports } = require('winston')

const SERVICES = {
  undefined: { clean: 'devl', color: [bold] },
  mhub: { clean: 'mhub', color: [yellow] },
  primary: { clean: 'main', color: [bold, blue] },
  mongo: { clean: 'mongo', color: [green] }
}

const LOG_LEVELS = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
}

const getServiceMap = (mapFunc = x => x) => {
  const maxLength = Object.values(SERVICES)
    .map(s => s.clean.length)
    .reduce((max, curr) => max > curr ? max : curr, -Infinity)

  return Object.entries(SERVICES)
    .map(([key, service]) => [key, service, service.clean.padEnd(maxLength)])
    .map(([key, service, name]) => ({ [key]: mapFunc(name, service) }))
    .reduce((obj, entry) => Object.assign(obj, entry), {})
}

const coloredFormat = () => {
  const map = getServiceMap((name, service) => service.color.reduce((str, color) => color(str), name))

  return format.printf(record => {
    const { service, message } = record
    return `[${map[service]}] ${message}`
  })
}

const noColorFormat = () => {
  const map = getServiceMap()

  return format.printf(record => {
    const { service, message } = record
    return `[${map[service]}] ${message}`
  })
}

exports.createLogger = options => {
  return createLogger({
    levels: LOG_LEVELS,
    level: options.logLevel,
    format: options.noColor ? noColorFormat() : coloredFormat(),
    transports: [
      new transports.Console()
    ]
  })
}
