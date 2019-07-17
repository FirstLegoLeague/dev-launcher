
const mkdirp = require('mkdirp')
const path = require('path')
const Promise = require('bluebird')

const { SpawnedService } = require('./services')
const logParsers = require('./log-parsers')

const mkdirpAsync = Promise.promisify(mkdirp)

function resolveInspectArgs (inspect, inspectBrk) {
  if (inspect === true) {
    return ['--inspect']
  } else if (inspect) {
    return [`--inspect=${inspect}`]
  } else if (inspectBrk === true) {
    return ['--inspect-brk']
  } else if (inspectBrk) {
    return [`--inspect-brk=${inspectBrk}`]
  } else {
    return []
  }
}

exports.PrimaryModule = class PrimaryModule extends SpawnedService {
  constructor (options, logger) {
    super()
    this._options = options
    this._logger = logger
  }

  _resolveCommandAndArgs () {
    const [optionsCommand, ...optionsArgs] = this._options._
    const module = this._options.module
    let moduleCommand, moduleArgs

    if (optionsCommand) {
      moduleCommand = optionsCommand
      moduleArgs = optionsArgs
    } else if (module.type === 'node') {
      const inspectArgs = resolveInspectArgs(this._options.inspect, this._options.inspectBrk)
      moduleCommand = 'node'
      moduleArgs = [].concat(inspectArgs, [module.script], optionsArgs || module.arguments || [])
    } else {
      moduleCommand = module.executable
      moduleArgs = optionsArgs || module.arguments || []
    }

    return { command: moduleCommand, args: moduleArgs }
  }

  _start () {
    const { command, args } = this._resolveCommandAndArgs()

    this._logger.info(`Starting primary command: ${this._options.moduleCommand} ${args.map(x => `"${x}"`).join(' ')}`)

    return mkdirpAsync(path.resolve(this._options.dataDirectory))
      .then(() => {
        const env = {
          'PORT': this._options.port,
          'SECRET': this._options.secret,
          'PROTECTED_MHUB_PASSWORD': this._options.mhubPass,
          'MHUB_URI': this._options.mhub.url,
          'NODE_ENV': 'development',
          'LOG_LEVEL': this._options.logLevel,
          'DATA_DIR': this._options.dataDirectory,
          'PATH': process.env.PATH
        }

        if ((this._options.module.require || []).includes('mongodb')) {
          env.MONGO_URI = this._options.mongoUri
        }

        this._options.secondaryModules.forEach(({ name, url }) => {
          env[`MODULE_${name.toUpperCase().replace(/-/g, '_')}_URL`] = url
        })

        const child = this.spawn(command, args, {
          cwd: path.resolve(this._options.moduleDirectory),
          stdio: 'pipe',
          env,
          detached: false
        })

        const childLogger = this._logger.child({ service: 'primary' })

        child.stdout.on('data', logParsers.json(childLogger))
        child.stderr.on('data', logParsers.custom(line => {
          childLogger.error(line)
        }))
      })
  }
}
