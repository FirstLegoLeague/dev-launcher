
const os = require('os')
const path = require('path')
const yargs = require('yargs')

const { coerceAlphaNum } = require('./helpers')

exports.config = () => {
  yargs
    .options({
      'mhub-pass': {
        group: 'Mhub:',
        description: 'The mhub protected password',
        type: 'string',
        default: 'protected',
        coerce: coerceAlphaNum
      },
      'mhubLauncherPass': {
        group: 'Mhub:',
        hidden: true,
        type: 'string',
        default: 'launcherPass',
        coerce: coerceAlphaNum
      },
      'mhubStorageDirectory': {
        group: 'Mhub:',
        hidden: true,
        type: 'string',
        default: () => path.join(os.tmpdir(), `mhub/storage-${Date.now()}`),
        coerce: path.resolve
      },
      'mhubConfigFile': {
        group: 'Mhub:',
        hidden: true,
        type: 'string',
        default: () => path.join(os.tmpdir(), `mhub/config-${Date.now()}.json`),
        coerce: path.resolve
      }
    })
}
