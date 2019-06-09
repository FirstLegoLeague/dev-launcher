
const mkdirp = require('mkdirp')
const path = require('path')
const Promise = require('bluebird')
const spawn = require('cross-spawn')
const { EventEmitter } = require('events')

const mkdirpAsync = Promise.promisify(mkdirp)

const SEC_MODULE_REGEX = /^([-a-z0-9]+)=(.+)$/

exports.PrimaryModule = class PrimaryModule extends EventEmitter {
  constructor (options) {
    super()
    this._options = options
    this._started = false
    this._stopped = false
    this._child = null
  }

  start () {
    if (this._started) {
      throw new Error('Service already started')
    }
    this._started = true

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

        return spawn(this._options.moduleCommand, this._options.moduleArguments, {
          cwd: path.resolve(this._options.moduleDirectory),
          stdio: 'pipe',
          env,
          detached: false
        })
      })
      .tap(child => {
        this._child = child

        child.on('exit', (function () { this._stopped = true }).bind(this))

        child.on('exit', this.emit.bind(this, 'exit'))
        child.on('error', this.emit.bind(this, 'error'))

        child.stdout.on('data', this.emit.bind(this, 'stdout'))
      })
  }

  stop () {
    return new Promise((resolve, reject) => {
      if (this._stopped || this._child.killed) {
        resolve()
      } else {
        this._child.on('exit', () => resolve())
        this._child.kill('SIGINT')
      }
    })
  }

  kill () {
    return new Promise((resolve, reject) => {
      if (this._stopped || this._child.killed) {
        resolve()
      } else {
        this._child.on('exit', () => resolve())
        this._child.kill('SIGKILL')
      }
    })
  }
}
