
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

function calculateInspectArg (inspect, inspectBrk) {
  if (inspect && inspectBrk) {
    throw Error('Can\'t use --inspect and --inspect-brk simultaneously')
  }

  if (inspect === true) {
    return ['--inspect']
  } else if (inspect) {
    return [`--inspect=${inspect}`]
  } else if (inspectBrk === true) {
    return ['--inspect-brk']
  } else if (inspectBrk) {
    return [`--inspect-brk=${inspectBrk}`]
  } else {
    return []
  }
}

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
      this._exiting = true
      console.log(`[${bold('devl')}] Exiting remain services`)
      return Promise.all(this._services.map(service => {
        return service.stop()
          .timeout(1000)
          .catch(() => service.kill())
          .reflect()
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
        let moduleCommand, moduleArguments

        if (this._command) {
          moduleCommand = this._command
          moduleArguments = this._args || []
        } else if (module.type === 'node') {
          const inspectArg = calculateInspectArg(this._cmdOptions.inspect, this._cmdOptions.inspectBrk)
          moduleCommand = 'node'
          moduleArguments = [].concat(inspectArg, [module.script], this._args || module.arguments || [])
        } else {
          moduleCommand = module.executable
          moduleArguments = this._args || module.arguments || []
        }

        return {
          module,
          moduleCommand,
          moduleArguments,
          moduleDirectory: '.',
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

        mhubService.on('exit', code => {
          if (code) {
            console.log(`[${bold('devl')}] MHub closed with code: ${code}`)
          } else {
            console.log(`[${bold('devl')}] MHub closed`)
          }
          setImmediate(() => this.exit(2))
        })
        mhubService.on('log', data => { process.stdout.write(`[${blue('mhub')}] ${data}`) })

        console.log(`[${bold('devl')}] Starting mhub...`)
        return mhubService.start()
      })
      .tap(options => {
        const configurator = new Configurator(options)
        this._services.push(configurator)

        configurator.on('log', data => { process.stdout.write(`[conf] ${data}\n`) })

        return configurator.start()
      })
      .tap(options => {
        const primaryModule = new PrimaryModule(options, process.stdout)
        this._services.push(primaryModule)

        primaryModule.on('exit', () => {
          console.log(`[${bold('devl')}] Main module closed`)
          this.exit()
        })
        primaryModule.on('log', data => { process.stdout.write(`[${red('main')}] ${data}`) })

        console.log(`[${bold('devl')}] Starting primary command: ${options.moduleCommand} ${options.moduleArguments.map(x => `"${x}"`).join(' ')}`)
        return primaryModule.start()
      })
  }
}
