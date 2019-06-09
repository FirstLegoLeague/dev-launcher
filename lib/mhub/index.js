
const Promise = require('bluebird')
const jsonfile = require('jsonfile')
const mkdirp = require('mkdirp')
const path = require('path')

const { createConfiguration } = require('./config-factory')

const { SpawnedService } = require('../services')

const mkdirpAsync = Promise.promisify(mkdirp)

const MHUB_BIN = require.resolve('mhub/bin/mhub-server')

exports.MhubService = class MhubService extends SpawnedService {
  constructor (options) {
    super()
    this._options = options
  }

  _start () {
    const configuration = createConfiguration(this._options)

    return Promise.all([
      mkdirpAsync(path.dirname(this._options.mhubConfigFile)),
      mkdirpAsync(this._options.mhubStorageDirectory)
    ])
      .then(() => jsonfile.writeFile(this._options.mhubConfigFile, configuration))
      .then(() => {
        return this.spawn(MHUB_BIN, ['-c', this._options.mhubConfigFile], {
          cwd: '.',
          stdio: 'pipe',
          detached: false
        })
      })
      .delay(2000)
  }
}
