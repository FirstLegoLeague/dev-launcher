
const Promise = require('bluebird')

exports.OneTimeService = class OneTimeService {
  constructor () {
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
