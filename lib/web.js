
const camelCase = require('camelcase')
const mkdirp = require('mkdirp')
const jsonfile = require('jsonfile')
const path = require('path')
const Promise = require('bluebird')

const { SpawnedService } = require('./services')
const logParsers = require('./log-parsers')

const mkdirpAsync = Promise.promisify(mkdirp)

const SEC_MODULE_REGEX = /^([-a-z0-9]+)=(.+)$/

exports.WebModule = class WebModule extends SpawnedService {
  constructor (options, logger) {
    super()
    this._options = options
    this._logger = logger

    this._envFile = options.web.envFile
  }

  _start () {
    this._logger.info(`Starting primary command: ${this._options.moduleCommand} ` +
      this._options.moduleArguments.map(x => `"${x}"`).join(' '))

    return mkdirpAsync(path.resolve(this._options.dataDirectory))
      .then(() => {
        const env = {
          'mhubUri': 'ws://localhost:13900'
        }

        this._options.secondaryModules.forEach(module => {
          const [, name, url] = SEC_MODULE_REGEX.exec(module)

          env[`module${camelCase(name, { pascalCase: true })}Url`] = url
        })

        return mkdirpAsync(path.dirname(this._envFile))
          .then(() => jsonfile.writeFile(this._envFile, env))
          .then(() => this.spawn(this._options.moduleCommand, this._options.moduleArguments, {
            cwd: path.resolve(this._options.moduleDirectory),
            stdio: 'pipe',
            env: {
              'ENV_FILE': this._envFile,
              'PATH': process.env.PATH
            },
            detached: false
          }))
          .tap(child => {
            const childLogger = this._logger.child({ service: 'primary' })

            child.stdout.on('data', logParsers.clean(childLogger))
            child.stderr.on('data', logParsers.clean(childLogger, { error: true }))
          })
      })
  }
}
