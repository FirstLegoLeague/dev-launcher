
const mkdirp = require('mkdirp')
const path = require('path')

exports.start = options => {
  mkdirp.sync(path.resolve('./data', 'main'))

  const moduleCommand = process.argv.slice(2)
    .map(x => x.replace(/"/g, '\\"'))
    .map(x => `"${x}"`)
    .join(' ')

  const env = {
    'PORT': 3000,
    'SECRET': 'confpass',
    'PROTECTED_MHUB_PASSWORD': 'propass',
    'MHUB_URI': 'ws://localhost:13900',
    'NODE_ENV': 'development',
    'LOG_LEVEL': 'debug',
    'DATA_DIR': path.resolve('./data', 'main')
  }

  const envString = Object.entries(env)
    .map(e => e.join('='))
    .join(' ')

  return `${envString} ${moduleCommand}`
}
