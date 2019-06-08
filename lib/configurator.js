const crypto = require('crypto')
const fs = require('fs')
const jsonfile = require('jsonfile')
const mkdirp = require('mkdirp')
const path = require('path')
const { MClient } = require('mhub')

const CONFIG_FILE = path.resolve('./data/config.json')
const JSON_FORMAT = {
  spaces: 2
}

function publish (mClient, moduleName, config) {
  console.log('start sending configuration')

  return Promise.resolve()
    .then(() => mClient.connect())
    .then(() => mClient.login('launcher', 'launchpass'))
    .catch(err => {
      if (!err.message.includes('already logged in')) {
        throw err
      }
    })
    .then(() => Object.entries(config).map(([name, value]) => ({ name, value })))
    .then(fields => mClient.publish('configuration', `config:${moduleName}`, { fields }))
    .then(() => console.log('Configuration sent'))
}

function loadConfig (moduleFields) {
  return jsonfile.readFile(CONFIG_FILE)
    .catch(err => {
      if (err.code !== 'ENOENT') {
        throw err
      } else {
        return {}
      }
    })
    .then(config => {
      let fullConfig = null

      for (const field of Object.keys(moduleFields)) {
        if (!Object.keys(config).includes(field)) {
          if (!fullConfig) {
            fullConfig = Object.assign({}, config)
          }
          fullConfig[field] = moduleFields[field].default
        }

        if (moduleFields[field].type === 'password') {
          const value = config[field] || fullConfig[field]
          if (typeof value === 'string') {
            if (!fullConfig) {
              fullConfig = Object.assign({}, config)
            }
            const salt = crypto.randomBytes(6).toString('base64')
            fullConfig[field] = {
              hash: crypto.createHash('sha256').update(value + salt).digest('base64'),
              salt
            }
          }
        }
      }
      return fullConfig
      // if (fullConfig) {
      //   return jsonfile.writeFile(CONFIG_FILE, fullConfig, JSON_FORMAT)
      //     .then(() => fullConfig)
      // } else {
      //   return config
      // }
    })
}

exports.start = options => {
  mkdirp.sync('./data/')

  const moduleName = options.module.name
  const moduleConfig = options.module.config
  const moduleFields = moduleConfig
    .map(({ fields }) => fields
      .map(field => {
        return { [field.name]: field }
      }))
    .reduce((arr, sub) => arr.concat(sub), [])
    .reduce((obj, entry) => Object.assign(obj, entry), {})

  setTimeout(() => {
    const mClient = new MClient('ws://localhost:13900', {
      noImplicitConnect: true,
      timeout: 500
    })

    loadConfig(moduleFields)
      .then(config => publish(mClient, moduleName, config))
      .then(() => {
        fs.watchFile(CONFIG_FILE, () => {
          loadConfig(moduleFields)
            .then(config => publish(mClient, moduleName, config))
            .catch(err => {
              console.error(err)
              process.exit(1)
            })
        })
      })
      .catch(err => {
        console.error(err)
        process.exit(1)
      })
  }, 1000)
}
