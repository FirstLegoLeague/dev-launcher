# DevL (Dev-Launcher)
A launcher simulation to run modules independently during development

# Features

- Running mhub process
- Injecting environment variables
- Sending module configurations updates

# Basic usage

In your module directory, use the `devl` command before the server command, e.g,:
```sh
devl node server.js
```

For more options:
```
--port, -p <port>                              In which port to open the primary module. Default to: 3000                                       optional                      
--log-level, -L <logLevel>                     In which port to open the primary module                                                         optional      default: "debug"
--data-dir, -d <dataDirectory>                 Directory to store service data. Default to: ./data                                              optional                      
--secondary-module, -s <secondaryModules>      Module's url to pass to the primary module in the format "#module_name#=#origin#                 optional                      
--config-file <configFile>                     The config file for the primary module. Default to: ./module-config.json                         optional                      
--mongo-uri <mongoUri>                         The mongo uri for the primary module. Default to: mongodb://localhost:27017/##module-name##      optional                      
--secret <secret>                              The secret token. Default: secret                                                                optional                      
--mhub-pass <mhubPass>                         The mhub protected password 
```

# Changing module config
When the DevL is running it's watching a module config file `module-config.json`
(or otherwise if specified). The file is created automatically if not already
exists. Any change to the file will send the new configuration to the primary
module.

# Adding secondary modules
When needed to pass the primary module a environment variable indicating the url
of another module - from now on the secondary module - pass the option
`--secondary-module` or `-s` with the value `#module_name#=#url#`. This will 
cause DevL to inject the environment variable `MODULE_#NAME#_URL` (`#NAME#`
should be switched with the module name) with the url part of the value.

*NOTICE:* It's the developer responsibility to start the secondary module
processes.    