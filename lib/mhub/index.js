
const Promise = require('bluebird')
const jsonfile = require('jsonfile')
const mkdirp = require('mkdirp')
const path = require('path')

const { createConfiguration } = require('./config-factory')

const logParsers = require('../log-parsers')
const { SpawnedService } = require('../services')

const mkdirpAsync = Promise.promisify(mkdirp)

const MHUB_BIN = require.resolve('mhub/bin/mhub-server')

const MHUB_LOG_REGEX = /^\[([FEWID])] /
const logLevel = {
  'F': 'fatal',
  'E': 'error',
  'W': 'wran',
  'I': 'info',
  'D': 'debug'
}

exports.MhubService = class MhubService extends SpawnedService {
  constructor (options, logger) {
    super()
    this._options = options
    this._logger = logger
  }

  _start () {
    this._logger.info(`Starting mhub...`)
    const configuration = createConfiguration(this._options)

    return Promise.all([
      mkdirpAsync(path.dirname(this._options.mhubConfigFile)),
      mkdirpAsync(this._options.mhubStorageDirectory)
    ])
      .then(() => jsonfile.writeFile(this._options.mhubConfigFile, configuration))
      .then(() => this.spawn(MHUB_BIN, ['-c', this._options.mhubConfigFile], {
        cwd: '.',
        stdio: 'pipe',
        detached: false
      }))
      .tap(child => {
        const childLogger = this._logger.child({ service: 'mhub' })

        child.stdout.on('data', data => {
          const message = data.toString().trim()
          try {
            const shortLevel = MHUB_LOG_REGEX.exec(message)[1]
            childLogger[logLevel[shortLevel]](message.substring(4))
          } catch (e) {
            this._logger.error('can\'t parse log from mhub')
            childLogger.error(message)
          }
        })

        child.stderr.on('data', logParsers.custom(line => {
          childLogger.error(line)
        }))
      })
      .delay(2000)
  }
}
