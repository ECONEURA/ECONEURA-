/* eslint-disable no-console */
// Lightweight logger compatibility layer used by other packages during typechecking
// Keeps a very small API so callers importing '@econeura/shared/logging' work
export const logger = {
  info: (msg: string, ...args: any[]) => {
    return console.info(msg, ...(args || []));
  },
  warn: (msg: string, ...args: any[]) => {
    return console.warn(msg, ...(args || []));
  },
  error: (msg: string, ...args: any[]) => {
    return console.error(msg, ...(args || []));
  },
  debug: (msg: string, ...args: any[]) => {
    return console.debug(msg, ...(args || []));
  },
};

// Also provide an 'apiLogger' quick shim used in some artifacts
export const apiLogger = {
  logStartup: (msg: string, meta?: any) => logger.info(msg, meta),
  logShutdown: (msg: string, meta?: any) => logger.info(msg, meta),
};

export default logger;
