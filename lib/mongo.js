
const Promise = require('bluebird')
const mkdirp = require('mkdirp')

const logParsers = require('./log-parsers')
const { SpawnedService } = require('./services/spawned-service')

const mkdirpAsync = Promise.promisify(mkdirp)

const logLevel = {
  'F': 'fatal',
  'E': 'error',
  'W': 'wran',
  'I': 'info',
  'D': 'debug'
}

const MONGO_LOG_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{4}\s([FEWID])\s/
const MONGO_BIN = 'mongod'

exports.MongoServer = class MongoServer extends SpawnedService {
  constructor (options, logger) {
    super()
    this._options = options
    this._logger = logger
  }

  _start () {
    this._logger.info(`Starting mongo...`)

    return mkdirpAsync(this._options.mongoDataPath)
      .then(() => this.spawn(MONGO_BIN, ['--quiet', '--dbpath', this._options.mongoDataPath], {
        cwd: '.',
        stdio: 'pipe',
        detached: false
      }))
      .tap(child => {
        const childLogger = this._logger.child({ service: 'mongo' })

        child.stdout.on('data', logParsers.custom(line => {
          try {
            const shortLevel = MONGO_LOG_REGEX.exec(line)[1]
            childLogger[logLevel[shortLevel]](line.substring(31))
          } catch (e) {
            this._logger.error('can\'t parse log from mongo')
            childLogger.error(line)
          }
        }))
      })
      .delay(2000)
  }
}
