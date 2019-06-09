#!/usr/bin/env node

const concurrently = require('concurrently')
const fs = require('fs')
const yaml = require('js-yaml')
const caporal = require('caporal')

const { version: projectVersion } = require('./package.json')

// const main = require('./main')
const mhub = require('./mhub')
const mock = require('./mock-api')
const configurator = require('./lib/configurator')

// const options = {
//   module: yaml.safeLoad(fs.readFileSync('./module.yml', 'utf8'))
// }

const { Main } = require('./lib/main')

caporal
  .version(projectVersion)
  .option('--port, -p <port>', 'In which port to open the primary module. Default to: 3000', caporal.INT)
  .option('--log-level, -L <logLevel>', 'In which port to open the primary module',
    ['fatal', 'error', 'warn', 'info', 'debug'], 'debug')
  .option('--data-dir, -d <dataDirectory>', 'Directory to store service data. Default to: ./data')
  .option('--secondary-module, -s <secondaryModules>', 'Module\'s url to pass to the primary module in the format "#module_name#=#origin#', caporal.REPEATABLE)
  .option('--config-file <configFile>', 'The config file for the primary module. Default to: ./module-config.json')
  .option('--mongo-uri <mongoUri>', 'The mongo uri for the primary module. Default to: mongodb://localhost:27017/##module-name##')
  .option('--secret <secret>', 'The secret token. Default: secret', /[A-Za-z01-9]/g)
  .option('--mhub-pass <mhubPass>', 'The mhub protected password', /[A-Za-z01-9]/g)
  .argument('<moduleCommand>', 'The command to start the primary module')
  .argument('[moduleArguments...]', 'The arguments to pass the primary module\' command')
  .action((args, options, logger) => {
    const main = new Main(args.moduleCommand, args.moduleArguments, options)
    main.start()
  })

caporal.parse(process.argv)

// concurrently([
//   {
//     name: 'mhub',
//     command: mhub.start(options)
//   },
//   {
//     name: 'main',
//     command: main.start(options),
//     prefixColor: 'green'
//   }
// ])
//   .catch(err => {
//     console.error(err)
//   })
//
// mock.start(options)
// configurator.start(options)
//
// function cleanExit () { process.exit() }
// process.on('SIGINT', cleanExit) // catch ctrl-c
// process.on('SIGTERM', cleanExit)
// process.on('uncaughtException', cleanExit)
// process.on('unhandledRejection', cleanExit)
