
const Promise = require('bluebird')
const spawn = require('cross-spawn')

const { OneTimeService } = require('./one-time')

class SpawnedService {
  constructor () {
    this._started = false
    this._stopped = false
    this._child = null
    this._listener = () => {}
  }

  spawn () {
    const child = this._child = spawn.apply(null, arguments)

    child.on('exit', this._flagStopped.bind(this))
    child.on('exit', this._logExit.bind(this))
    child.on('exit', this._listener)

    return child
  }

  _flagStopped () {
    this._stopped = true
  }

  _logExit (code) {
    if (code) {
      this._logger.info(`${this.constructor.name} exited with code: ${code}`)
    } else {
      this._logger.info(`${this.constructor.name} exited`)
    }
  }

  onExit (listener) {
    if (this._child) {
      this._child.removeListener('exit', this._listener)
      this._child.on('exit', listener)
    }
    this._listener = listener
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

SpawnedService.prototype.start = OneTimeService.prototype.start

exports.SpawnedService = SpawnedService
