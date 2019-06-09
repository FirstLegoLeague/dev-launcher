
const Promise = require('bluebird')
const jsonfile = require('jsonfile')
const { EventEmitter } = require('events')
const spawn = require('cross-spawn')
const mkdirp = require('mkdirp')
const path = require('path')

const { createConfiguration } = require('./config-factory')

const mkdirpAsync = Promise.promisify(mkdirp)

const MHUB_BIN = require.resolve('mhub/bin/mhub-server')

exports.MhubService = class MhubService extends EventEmitter {
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

    const configuration = createConfiguration(this._options)

    return Promise.all([
      mkdirpAsync(path.dirname(this._options.mhubConfigFile)),
      mkdirpAsync(this._options.mhubStorageDirectory)
    ])
      .then(() => jsonfile.writeFile(this._options.mhubConfigFile, configuration))
      .then(() => {
        return spawn(MHUB_BIN, ['-c', this._options.mhubConfigFile], {
          cwd: '.',
          stdio: 'pipe',
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
      .delay(2000)
  }

  stop () {
    return new Promise((resolve, reject) => {
      if (this._stopped || this._child.killed) {
        resolve()
      } else {
        this._child.on('exit', () => resolve())
        this._child.kill()
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
