
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const yargs = require('yargs')

function loadModuleData () {
  try {
    return yaml.safeLoad(fs.readFileSync(path.resolve('.', 'module.yml')))
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    return {}
  }
}

exports.config = () => {
  yargs
    .options({
      'module': {
        group: 'Module:',
        hidden: true,
        default: loadModuleData
      },
      'moduleDirectory': {
        group: 'Module:',
        hidden: true,
        default: '.',
        coerce: path.resolve
      }
    })
}
