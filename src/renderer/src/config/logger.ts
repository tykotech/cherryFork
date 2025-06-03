import Logger from 'electron-log/renderer'

// Set log level for renderer process
Logger.transports.console.level = 'info'

export default Logger
