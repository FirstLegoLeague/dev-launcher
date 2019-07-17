const path = require('path')
const yargs = require('yargs')

exports.config = () => {
  yargs
    .options({
      'mongo-uri': {
        group: 'Mongo:',
        description: 'The mongo uri for the primary module',
        type: 'string'
      },
      'mongo-dbpath': {
        group: 'Mongo:',
        description: 'The mongo data directory path',
        type: 'string',
        default: './data/$mongo',
        coerce: path.resolve
      }
    })
}
