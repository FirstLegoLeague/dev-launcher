
const mkdirp = require('mkdirp')
const MockServer = require('node-mock-server')
const path = require('path')

exports.start = options => {
  mkdirp.sync('./data/mock/')
  mkdirp.sync('./mocks/rest')
  mkdirp.sync('./mocks/func')

  const dataDir = path.resolve('./mocks')

  const { appController } = MockServer({
    restPath: path.join(dataDir, 'rest'),
    dirName: __dirname,
    title: 'Api mock server',
    version: 2,
    urlBase: 'http://localhost:3001',
    urlPath: '',
    port: 3001,
    uiPath: '/ui',
    funcPath: path.join(dataDir, 'func'),
    // headers: {
    //   'Global-Custom-Header': 'Global-Custom-Header'
    // },
    middleware: new Proxy({}, {
      get: (target, prop) => {
        const modulePath = path.join(prop, 'middleware.js')

        delete require.cache[require.resolve(modulePath)]

        return (serverOptions, requestOptions) => {
          try {
            // eslint-disable-next-line import/no-dynamic-require
            const moduleExports = require(modulePath)

            let middleware
            switch (typeof moduleExports) {
              case 'function':
                middleware = moduleExports
                break
              case 'object':
                middleware = moduleExports.middleware
            }

            return middleware(serverOptions, requestOptions)
          } catch (err) {
            console.error(err)

            requestOptions.res.status(500).end(err.stack)
          }
        }
      }
    }),
    open: false
  })

  // process.on('SIGINT', () => {
  //   process.exit(130)
  // })
}
