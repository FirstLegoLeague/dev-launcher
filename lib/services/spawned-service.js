
const { EventEmitter } = require('events')
const Promise = require('bluebird')
const spawn = require('cross-spawn')

const { OneTimeService } = require('./one-time')

class SpawnedService extends EventEmitter {
  constructor () {
    super()
    this._started = false
    this._stopped = false
    this._child = null
  }

  spawn () {
    const child = this._child = spawn.apply(null, arguments)
    return Promise.resolve(child)
      .tap(() => {
        child.on('exit', this._flagStopped.bind(this))

        child.on('exit', this.emit.bind(this, 'exit'))
        child.on('error', this.emit.bind(this, 'error'))

        child.stdout.on('data', this.emit.bind(this, 'log'))
      })
  }

  _flagStopped () {
    this._stopped = true
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
