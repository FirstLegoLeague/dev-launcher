#!/usr/bin/env node

const concurrently = require('concurrently')
const fs = require('fs')
const yaml = require('js-yaml')

const main = require('./main')
const mhub = require('./mhub')
const mock = require('./mock-api')
const configurator = require('./lib/configurator')

const options = {
  module: yaml.safeLoad(fs.readFileSync('./module.yml', 'utf8'))
}

concurrently([
  {
    name: 'mhub',
    command: mhub.start(options)
  },
  {
    name: 'main',
    command: main.start(options),
    prefixColor: 'green'
  }
])
  .catch(err => {
    console.error(err)
  })

mock.start(options)
configurator.start(options)

function cleanExit () { process.exit() }
process.on('SIGINT', cleanExit) // catch ctrl-c
process.on('SIGTERM', cleanExit)
