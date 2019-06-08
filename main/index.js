
exports.start = options => {
  const moduleCommand = process.argv.slice(2)
    .map(x => x.replace(/"/g, '\\"'))
    .map(x => `"${x}"`)
    .join(' ')

  const env = {
    'PORT': 3000,
    'SECRET': 'confpass',
    'PROTECTED_MHUB_PASSWORD': 'propass',
    'MHUB_URI': 'ws://localhost:13900',
    'NODE_ENV': 'development'
  }

  const envString = Object.entries(env)
    .map(e => e.join('='))
    .join(' ')

  return `${envString} ${moduleCommand}`
}
