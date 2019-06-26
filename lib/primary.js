
const mkdirp = require('mkdirp')
const path = require('path')
const Promise = require('bluebird')

const { SpawnedService } = require('./services')
const logParsers = require('./log-parsers')

const mkdirpAsync = Promise.promisify(mkdirp)

const SEC_MODULE_REGEX = /^([-a-z0-9]+)=(.+)$/

exports.PrimaryModule = class PrimaryModule extends SpawnedService {
  constructor (options, logger) {
    super()
    this._options = options
    this._logger = logger
  }

  _start () {
    this._logger.info(`Starting primary command: ${this._options.moduleCommand} ` +
      this._options.moduleArguments.map(x => `"${x}"`).join(' '))

    return mkdirpAsync(path.resolve(this._options.dataDirectory))
      .then(() => {
        const env = {
          'PORT': this._options.port,
          'SECRET': this._options.secret,
          'PROTECTED_MHUB_PASSWORD': this._options.mhubPass,
          'MHUB_URI': 'ws://localhost:13900',
          'NODE_ENV': 'development',
          'LOG_LEVEL': this._options.logLevel,
          'DATA_DIR': this._options.dataDirectory,
          'PATH': process.env.PATH
        }

        if ((this._options.module.require || []).includes('mongodb')) {
          env.MONGO_URI = this._options.mongoUri
        }

        this._options.secondaryModules.forEach(module => {
          const [, name, url] = SEC_MODULE_REGEX.exec(module)

          env[`MODULE_${name.toUpperCase().replace(/-/g, '_')}_URL`] = url
        })

        return this.spawn(this._options.moduleCommand, this._options.moduleArguments, {
          cwd: path.resolve(this._options.moduleDirectory),
          stdio: 'pipe',
          env,
          detached: false
        })
          .tap(child => {
            const childLogger = this._logger.child({ service: 'primary' })

            child.stdout.on('data', logParsers.json(childLogger))
            child.stderr.on('data', logParsers.custom(line => {
              childLogger.error(line)
            }))
          })
      })
  }
}
