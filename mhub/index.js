
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { MClient } = require('mhub')
const { promisify } = require('util')

const mhubPath = require.resolve('mhub/bin/mhub-server')
const mhubConfigPath = path.join(__dirname, './config.json')

const readFile = promisify(fs.readFile)

exports.start = options => {
  mkdirp.sync(path.resolve('./data', 'mhub'))



  return `${mhubPath} -c ${mhubConfigPath}`
}
