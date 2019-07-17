
const Promise = require('bluebird')
const mkdirp = require('mkdirp')

const logParsers = require('../log-parsers')
const { SpawnedService } = require('../services/spawned-service')

const mkdirpAsync = Promise.promisify(mkdirp)

const logLevel = {
  'F': 'fatal',
  'E': 'error',
  'W': 'warn',
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

    return Promise.all([
      27017,
      mkdirpAsync(this._options.mongoDataPath)
    ])
      .then(([port]) => {
        this._port = port

        const child = this.spawn(MONGO_BIN, [
          '--quiet',
          '--port', port,
          '--dbpath', this._options.mongoDataPath
        ], {
          cwd: '.',
          stdio: 'pipe',
          detached: false
        })

        child.on('error', err => {
          if (err.code === 'ENOENT') {
            this._logger.fatal(`ERROR: Command '${MONGO_BIN}' not found. \n` +
              `Please make sure that the '${MONGO_BIN}' command is in your PATH environment variable`)
          } else {
            throw err
          }
        })

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
      .then(() => ({
        mongoUri: this._uri
      }))
  }

  get _uri () {
    if (this._port) {
      return `mongodb://127.0.0.1:${this._port}/${this._options.module.name}`
    } else {
      throw new Error('Mhub don\'t have url at this time')
    }
  }
}
