
exports.createConfiguration = (port, options) => {
  return {
    'listen': [
      {
        'type': 'websocket',
        'port': port
      }
    ],
    'logging': 'info',
    'nodes': {
      'public': 'Exchange',
      'protected': 'Exchange',
      'configuration': 'TopicStore'
    },
    'bindings': [],
    'users': {
      'configuration': options.secret,
      'launcher': options.mhubLauncherPass,
      'protected-client': options.mhubPass
    },
    'rights': {
      '': {
        'subscribe': {
          'public': true,
          'protected': true,
          'configuration': false
        },
        'publish': {
          'public': true,
          'protected': false,
          'configuration': false
        }
      },
      'protected-client': {
        'subscribe': {
          'public': true,
          'protected': true,
          'configuration': false
        },
        'publish': {
          'public': true,
          'protected': true,
          'configuration': false
        }
      },
      'configuration': {
        'subscribe': {
          'public': false,
          'protected': false,
          'configuration': [
            'config:*'
          ]
        },
        'publish': {
          'public': false,
          'protected': false,
          'configuration': [
            'config:*'
          ]
        }
      },
      'launcher': {
        'subscribe': true,
        'publish': true
      }
    },
    'storage': options.mhubStorageDirectory
  }
}
