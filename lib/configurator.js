const crypto = require('crypto')
const fs = require('fs')
const jsonfile = require('jsonfile')
const { MClient } = require('mhub')
const Promise = require('bluebird')

const { OneTimeService } = require('./services')

exports.Configurator = class Configurator extends OneTimeService {
  constructor (options) {
    super()
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
    return this.loadConfig()
      .then(config => this.publish(config))
      .then(() => {
        this._watcher = fs.watchFile(this._configFile, () => {
          this.loadConfig()
            .then(config => this.publish(config))
            .catch(err => {
              throw err
            })
        })
      })
  }

  loadConfig () {
    return jsonfile.readFile(this._configFile)
      .catch(err => {
        if (err.code !== 'ENOENT') {
          throw err
        } else {
          return {}
        }
      })
      .then(config => {
        let fullConfig = null

        for (const field of Object.keys(this._moduleFields)) {
          if (!Object.keys(config).includes(field)) {
            if (!fullConfig) {
              fullConfig = Object.assign({}, config)
            }
            fullConfig[field] = this._moduleFields[field].default
          }

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

  publish (config) {
    this.emit('log', 'start sending configuration')

    return this._mhubPromise
      .tap(mClient => {
        const fields = Object.entries(config)
          .map(([name, value]) => ({ name, value }))

        return mClient.publish('configuration', `config:${this._moduleName}`, { fields })
      })
      .tap(() => this.emit('log', 'Configuration sent'))
  }

  stop () {
    this._watcher.stop()
    return Promise.resolve()
  }

  kill () {
    return this.stop()
  }
}
