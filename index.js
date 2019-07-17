#!/usr/bin/env node

const options = require('./lib/options')
const { Runner } = require('./lib/runner')

new Runner(options.collect())
  .start()
