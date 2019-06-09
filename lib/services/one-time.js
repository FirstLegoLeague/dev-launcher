
const Promise = require('bluebird')
const { EventEmitter } = require('events')

exports.OneTimeService = class OneTimeService extends EventEmitter {
  constructor () {
    super()
    this._started = false
  }

  start () {
    if (this._started) {
      return Promise.reject(new Error('Service already started'))
    } else {
      return Promise.resolve(this._start())
    }
  }
}
