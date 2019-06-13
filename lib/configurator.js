const crypto = require('crypto')
const fs = require('fs')
const jsonfile = require('jsonfile')
const { MClient } = require('mhub')
const mkdirp = require('mkdirp')
const path = require('path')
const Promise = require('bluebird')

const mkdirpAsync = Promise.promisify(mkdirp)

const { OneTimeService } = require('./services')

exports.Configurator = class Configurator extends OneTimeService {
  constructor (options, logger) {
    super()
    this._logger = logger
    this._watcher = null

    this._configFile = options.configFile
    this._mhubLauncherPass = options.mhubLauncherPass

    this._moduleName = options.module.name
    this._moduleConfig = options.module.config

    this._moduleFields = this._moduleConfig
      .map(({ fields }) => fields
        .map(field => {
          return { [field.name]: field }
        }))
      .reduce((arr, sub) => arr.concat(sub), [])
      .reduce((obj, entry) => Object.assign(obj, entry), {})

    this._mhubPromise = Promise.resolve(new MClient('ws://localhost:13900', {
      noImplicitConnect: true,
      timeout: 500
    }))
      .tap(mClient => mClient.connect())
      .tap(mClient => mClient.login('launcher', this._mhubLauncherPass))
  }

  _start () {
    return this._loadConfig(true)
      .then(config => this._publish(config))
      .then(() => {
        this._watcher = fs.watchFile(this._configFile, () => {
          this._loadConfig()
            .then(config => this._publish(config))
            .catch(err => {
              throw err
            })
        })
      })
  }

  _loadConfig (writeFileIfMissing = false) {
    return Promise.resolve(jsonfile.readFile(this._configFile))
      .catch(err => {
        if (err.code !== 'ENOENT') {
          throw err
        }

        if (writeFileIfMissing) {
          const config = {}

          for (const field of Object.keys(this._moduleFields)) {
            config[field] = this._moduleFields[field].default
          }

          return mkdirpAsync(path.dirname(this._configFile))
            .then(() => jsonfile.writeFile(this._configFile, config, {
              spaces: 2
            }))
            .then(() => config)
        }

        return {}
      })
      .then(config => {
        let fullConfig = {}

        for (const field of Object.keys(this._moduleFields)) {
          fullConfig[field] = config[field] || this._moduleFields[field].default

          if (this._moduleFields[field].type === 'password') {
            const value = config[field] || fullConfig[field]
            if (typeof value === 'string') {
              if (!fullConfig) {
                fullConfig = Object.assign({}, config)
              }
              const salt = crypto.randomBytes(6).toString('base64')
              fullConfig[field] = {
                hash: crypto.createHash('sha256').update(value + salt).digest('base64'),
                salt
              }
            }
          }
        }

        return fullConfig
      })
  }

  _publish (config) {
    this._logger.info('start sending configuration...')

    return this._mhubPromise
      .tap(mClient => {
        const fields = Object.entries(config)
          .map(([name, value]) => ({ name, value }))

        return mClient.publish('configuration', `config:${this._moduleName}`, { fields })
      })
      .tap(() => this._logger.info('Configuration sent'))
  }

  onExit (listener) {}

  stop () {
    if (this._watcher) {
      this._watcher.stop()
    }
    return Promise.resolve()
  }

  kill () {
    return this.stop()
  }
}
