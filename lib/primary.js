
const mkdirp = require('mkdirp')
const path = require('path')
const Promise = require('bluebird')

const { SpawnedService } = require('./services')

const mkdirpAsync = Promise.promisify(mkdirp)

const SEC_MODULE_REGEX = /^([-a-z0-9]+)=(.+)$/

exports.PrimaryModule = class PrimaryModule extends SpawnedService {
  constructor (options) {
    super()
    this._options = options
  }

  _start () {
    return mkdirpAsync(path.resolve(this._options.dataDirectory))
      .then(() => {
        const env = {
          'PORT': this._options.port,
          'SECRET': this._options.secret,
          'PROTECTED_MHUB_PASSWORD': this._options.mhubPass,
          'MHUB_URI': 'ws://localhost:13900',
          'NODE_ENV': 'development',
          'LOG_LEVEL': this._options.logLevel,
          'DATA_DIR': this._options.dataDir
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
      })
  }
}
