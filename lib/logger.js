
const { yellow, blue, green, red, bold } = require('colorette')
const { createLogger, format, transports } = require('winston')

const SERVICES = {
  undefined: { clean: 'devl', colors: [bold] },
  mhub: { clean: 'mhub', colors: [yellow] },
  primary: { clean: 'main', colors: [bold, blue] },
  mongo: { clean: 'mongo', colors: [green] }
}

const logLevels = {
  fatal: { index: 0, colors: [bold, red] },
  error: { index: 1, colors: [red] },
  warn: { index: 2, colors: [yellow] },
  info: { index: 3, colors: [] },
  debug: { index: 4, colors: [green] }
}

const applyColors = (colors, cleanString) => colors.reduce((str, color) => color(str), cleanString)

const getServiceMap = (mapFunc = x => x) => {
  const maxLength = Object.values(SERVICES)
    .map(s => s.clean.length)
    .reduce((max, curr) => max > curr ? max : curr, -Infinity)

  return Object.entries(SERVICES)
    .map(([key, service]) => [key, service, service.clean.padEnd(maxLength)])
    .map(([key, service, name]) => ({ [key]: mapFunc(name, service) }))
    .reduce((obj, entry) => Object.assign(obj, entry), {})
}

const devlFormat = options => {
  const applyColorsFn = options.noColor ? s => s : applyColors

  const mapServiceName = getServiceMap((name, service) => applyColorsFn(service.colors, name))
  const formatMessage = r => applyColorsFn(logLevels[r.level].colors, r.message.split('\n').join('\n\t'))
  const formatLevel = r => applyColorsFn(logLevels[r.level].colors, r.level[0].toUpperCase())

  return format.printf(record => {
    const { service } = record
    return `${formatLevel(record)} [ ${mapServiceName[service]} ] ${formatMessage(record)}`
  })
}

exports.createLogger = options => {
  return createLogger({
    levels: Object.keys(logLevels)
      .reduce((obj, level) => Object.assign(obj, { [level]: logLevels[level].index }), {}),
    level: options.logLevel,
    format: devlFormat(options),
    transports: [
      new transports.Console()
    ]
  })
}
