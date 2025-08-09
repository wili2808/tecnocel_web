const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class ScriptLogger {
  constructor(level = "info") {
    this.level = logLevels[level] || logLevels.info;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg
      )
      .join(" ");

    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${formattedArgs}`.trim();
  }

  error(message, ...args) {
    if (this.level >= logLevels.error) {
      console.error(this.formatMessage("ERROR", message, ...args));
    }
  }

  warn(message, ...args) {
    if (this.level >= logLevels.warn) {
      console.warn(this.formatMessage("WARN", message, ...args));
    }
  }

  info(message, ...args) {
    if (this.level >= logLevels.info) {
      console.log(this.formatMessage("INFO", message, ...args));
    }
  }

  debug(message, ...args) {
    if (this.level >= logLevels.debug) {
      console.log(this.formatMessage("DEBUG", message, ...args));
    }
  }
}

const logger = new ScriptLogger(process.env.LOG_LEVEL || "info");

export default logger;
