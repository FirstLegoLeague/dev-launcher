#!/usr/bin/env node

const caporal = require('caporal')

const { version: projectVersion } = require('./package.json')
const { Main } = require('./lib/main')

const doubleDashIndex = process.argv.indexOf('--')
const optionsArgv = doubleDashIndex === -1 ? process.argv : process.argv.slice(0, doubleDashIndex)
const endArgs = doubleDashIndex === -1 ? [] : process.argv.slice(doubleDashIndex + 1)

caporal
  .version(projectVersion)
  .option('--config-file <configFile>', 'The config file for the primary module. Default to: ./module-config.json')
  .option('--data-directory, -d <dataDirectory>', 'Directory to store service data. Default to: ./data')
  .option('--inspect [host:port]', 'Adding node --inspect options to the node process. ' +
    'Works only when module command omitted')
  .option('--inspect-brk [host:port]', 'Adding node --inspect-brk options to the node process. ' +
    'Works only when module command omitted')
  .option('--log-level, -L <logLevel>', 'In which port to open the primary module',
    ['fatal', 'error', 'warn', 'info', 'debug'])
  .option('--mhub-pass <mhubPass>', 'The mhub protected password', /[A-Za-z01-9]/g)
  .option('--mongo-uri <mongoUri>',
    'The mongo uri for the primary module. Default to: mongodb://localhost:27017/##module-name##')
  .option('--no-color', 'Disable colors', caporal.BOOL)
  .option('--port, -p <port>', 'In which port to open the primary module. Default to: 3000', caporal.INT)
  .option('--secondary-modules, -s <secondaryModule>',
    'Module\'s url to pass to the primary module in the format "#module_name#=#origin#', caporal.REPEATABLE)
  .option('--secret <secret>', 'The secret token. Default: secret', /[A-Za-z01-9]/g)
  .argument('[moduleCommand]', 'The command to start the primary module')
  .argument('[-- moduleArguments...]', 'The arguments to pass the primary module\'s command')
  .action((args, options) => {
    const main = new Main(args.moduleCommand, endArgs, options)
    main.start()
  })

caporal.parse(optionsArgv)
