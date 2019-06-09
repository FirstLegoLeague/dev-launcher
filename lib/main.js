
const fs = require('fs')
const os = require('os')
const yaml = require('js-yaml')
const Promise = require('bluebird')
const path = require('path')
const { red, blue, bold } = require('colorette')

const readFileAsync = Promise.promisify(fs.readFile)

const { PrimaryModule } = require('./primary')
const { Configurator } = require('./configurator')
const { MhubService } = require('./mhub')

exports.Main = class Main {
  constructor (command, args, cmdOptions) {
    this._command = command
    this._args = args
    this._cmdOptions = cmdOptions
    this._services = []
    this._exiting = false

    process.on('SIGINT', this.exit.bind(this, 130))
    process.on('SIGTERM', this.exit.bind(this, 143))
    process.on('uncaughtException', this.handleError.bind(this))
    process.on('unhandledRejection', this.handleError.bind(this))
  }

  exit (code) {
    if (this._exiting) {
      return Promise.resolve()
    } else {
      return Promise.all(this._services.map(service => {
        return service.stop()
          .timeout(1000)
          .catch(() => service.kill())
      }))
        .finally(() => process.exit(code))
    }
  }

  handleError (err) {
    console.error(err.stack)
    this.exit(1)
  }

  loadModuleData () {
    return readFileAsync(path.resolve('.', 'module.yml'))
      .then(yaml.safeLoad)
  }

  resolveOptions () {
    return this.loadModuleData()
      .then(module => {
        return {
          module,
          moduleDirectory: '.',
          moduleCommand: this._command,
          moduleArguments: this._args,
          port: this._cmdOptions.port || 3000,
          logLevel: this._cmdOptions.logLevel || 'debug',
          dataDirectory: path.resolve(this._cmdOptions.dataDirectory || './data'),
          secondaryModules: this._cmdOptions.secondaryModules || [],
          configFile: path.resolve(this._cmdOptions.configFile || './module-config.json'),
          mongoUri: this._cmdOptions.mongoUri || `mongodb://localhost:27017/${module.name}`,
          secret: this._cmdOptions.secret || 'secret',
          mhubPass: this._cmdOptions.mhubPass || 'protected',
          mhubLauncherPass: 'launcherPass',
          mhubStorageDirectory: path.join(os.tmpdir(), `mhub/storage-${Date.now()}`),
          mhubConfigFile: path.join(os.tmpdir(), `mhub/config-${Date.now()}.json`)
        }
      })
  }

  start () {
    return this.resolveOptions()
      .tap(options => {
        const mhubService = new MhubService(options)
        this._services.push(mhubService)

        mhubService.on('exit', () => {
          console.log(`[${bold('devl')}] MHub closed, exiting...`)
          this.exit()
        })
        mhubService.on('error', err => { throw err })
        mhubService.on('stdout', data => { process.stdout.write(`[${blue('mhub')}] ${data}`) })

        return mhubService.start()
      })
      .tap(options => {
        const configurator = new Configurator(options)
        this._services.push(configurator)

        return configurator.start()
      })
      .tap(options => {
        const primaryModule = new PrimaryModule(options, process.stdout)
        this._services.push(primaryModule)

        primaryModule.on('exit', () => {
          console.log(`[${bold('devl')}] Main module closed, exiting...`)
          this.exit()
        })
        primaryModule.on('error', err => { throw err })
        primaryModule.on('stdout', data => { process.stdout.write(`[${red('main')}] ${data}`) })

        return primaryModule.start()
      })
  }
}
