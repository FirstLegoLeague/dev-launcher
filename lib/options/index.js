
const yargs = require('yargs')

const general = require('./general')
const mhub = require('./mhub')
const mongo = require('./mongo')
const moduleOpt = require('./module')

exports.collect = collect => {
  general.config()
  mhub.config()
  mongo.config()
  moduleOpt.config()

  return yargs
    .parserConfiguration({
      'halt-at-non-option': true,
      'strip-aliased': true,
      'strip-dashed': true
    })
    .string('_')
    .coerce('_', opt => {
      if (opt[0] === '--') {
        return Object.assign(opt.slice(), { 0: undefined })
      } else if (opt[1] === '--') {
        return [opt[0]].concat(opt.slice(2))
      } else {
        return opt
      }
    })
    .strict()
    .parse()
}
