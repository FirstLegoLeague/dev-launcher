
const Promise = require('bluebird')

const { createLogger } = require('./logger')

const { PrimaryModule } = require('./primary')
const { Configurator } = require('./configurator')
const { MhubService } = require('./mhub')
const { MongoServer } = require('./mongo')

const INIT = {}
const STARTING = {}
const READY = {}
const EXITING = {}

const ServiceFactories = [
  MhubService,
  Configurator,
  PrimaryModule
]

exports.Runner = class Runner {
  constructor (options) {
    this._options = options
    this._services = []
    this._status = INIT
    this._logger = createLogger(options)

    process.on('SIGINT', this.exit.bind(this, 130))
    process.on('SIGTERM', this.exit.bind(this, 143))
    process.on('uncaughtException', this.handleError.bind(this))
    process.on('unhandledRejection', this.handleError.bind(this))
  }

  exit (code) {
    if (this._status === EXITING) {
      return Promise.resolve()
    }

    this._status = EXITING
    this._logger.info(`Exiting remain services`)

    if (this._status === STARTING) {
      this._startPromise.cancel()
    }

    return Promise.all(this._services.map(service => {
      return service.stop()
        .timeout(1000)
        .catch(() => service.kill())
        .reflect()
    }))
      .finally(() => process.exit(code))
  }

  handleError (err) {
    console.error(err.stack)
    this.exit(1)
  }

  resolveServices () {
    if ((this._options.module.require || []).includes('mongodb') && !this._options.mongoUri) {
      ServiceFactories.unshift(MongoServer)
    }

    return Promise.resolve()
  }

  start () {
    let options = this._options

    this._status = STARTING
    this._startPromise = this.resolveServices()
      .tap(() => {
        return Promise.each(ServiceFactories, Factory => {
          const service = new Factory(options, this._logger)

          service.onExit(() => {
            this.exit(1)
          })
          this._services.push(service)

          return service.start()
            .then(newOptions => {
              options = Object.assign({}, options, newOptions)
            })
        })
      })
      .tap(() => { this._status = READY })

    return this._startPromise
  }
}
