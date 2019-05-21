
const concurrently = require('concurrently')
const path = require('path')

const mhubPath = require.resolve('mhub/bin/mhub-server')
const mhubConfigPath = path.join(__dirname, './mhub/config.json')

const MockServer = require('node-mock-server')

const moduleCommand = process.argv.slice(2)
  .map(x => x.replace(/"/g, '\\"'))
  .map(x => `"${x}"`)
  .join(' ')

concurrently([
  {
    name: 'mhub',
    command: `${mhubPath} -c ${mhubConfigPath}`
  },
  {
    name: 'module',
    command: `PORT=3000 ${moduleCommand}`
  }
])
  .catch(err => {
    console.error(err)
  })

MockServer({
  restPath: path.join(__dirname, '/mock/rest'),
  dirName: __dirname,
  title: 'Api mock server',
  version: 2,
  urlBase: 'http://localhost:3001',
  urlPath: '/rest/v2',
  port: 3001,
  uiPath: '/',
  funcPath: path.join(__dirname, '/func'),
  headers: {
    'Global-Custom-Header': 'Global-Custom-Header'
  },
  customDTOToClassTemplate: path.join(__dirname, '/templates/dto_es6flow.ejs'),
  middleware: {
    '/rest/products/#{productCode}/GET' (serverOptions, requestOptions) {
      const productCode = requestOptions.req.params[0].split('/')[3]

      if (productCode === '1234') {
        requestOptions.res.statusCode = 201
        requestOptions.res.end('product 1234')
        return null
      }

      return 'success'
    }
  },
  expressMiddleware: [
    function (express) {
      return ['/public', express.static(path.join(__dirname, '/public'))]
    }
  ],
  swaggerImport: {
    protocol: 'http',
    authUser: undefined,
    authPass: undefined,
    host: 'petstore.swagger.io',
    port: 80,
    path: '/v2/swagger.json',
    dest: path.join(__dirname, '/mock/rest'),
    replacePathsStr: '/v2/{baseSiteId}',
    createErrorFile: true,
    createEmptyFile: true,
    overwriteExistingDescriptions: true,
    responseFuncPath: path.join(__dirname, '/func-imported')
  },
  open: true
})
