
const _ = require('lodash')
const path = require('path')
const yargs = require('yargs')

const { coerceAlphaNum } = require('./helpers')

exports.config = () => {
  yargs
    .options({
      'config-file': {
        description: 'The config file for the primary module',
        type: 'string',
        default: './module-config.json',
        coerce: path.resolve
      },
      'data-directory': {
        alias: 'd',
        description: 'Directory to store service data',
        type: 'string',
        default: './data',
        coerce: path.resolve
      },
      'inspect': {
        description: 'Adding node --inspect options to the node process. Works only when module command omitted',
        type: 'string'
      },
      'inspect-brk': {
        description: 'Adding node --inspect-brk options to the node process. Works only when module command omitted',
        type: 'string'
      },
      'log-level': {
        alias: 'L',
        description: 'In which port to open the primary module',
        choices: ['fatal', 'error', 'warn', 'info', 'debug'],
        default: 'debug'
      },
      'no-color': {
        description: 'Disable colors',
        type: 'boolean'
      },
      'port': {
        alias: 'p',
        description: 'In which port to open the primary module',
        type: 'number',
        default: 3000
      },
      'secondary-modules': {
        alias: 's',
        description: 'Module\'s url to pass to the primary module in the format "##module_name##=##url_origin##"',
        type: 'string',
        default: [],
        coerce: opt => {
          const optionRegex = /^([-a-z0-9]+)=(.+)$/

          if (!Array.isArray(opt)) {
            opt = [opt]
          }

          return _.chain(opt)
            .map(s => s.split(','))
            .flatten()
            .map(s => {
              const match = optionRegex.exec(s)
              if (match) {
                const [, name, url] = optionRegex.exec(s)
                return { name, url }
              } else {
                throw new Error('The secondary module must be in the form "#module_name#=#url_origin#".\n' +
                `Got "${s}" instead.`)
              }
            })
            .value()
        }
      },
      'secret': {
        description: 'The secret token',
        default: 'secret',
        coerce: coerceAlphaNum
      }
    })
    .conflicts('inspect', 'inspect-brk')
}
