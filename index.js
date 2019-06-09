#!/usr/bin/env node

const caporal = require('caporal')

const { version: projectVersion } = require('./package.json')
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
  .argument('[moduleArguments...]', 'The arguments to pass the primary module\'s command')
  .action((args, options) => {
    const main = new Main(args.moduleCommand, args.moduleArguments, options)
    main.start()
  })

caporal.parse(process.argv)
