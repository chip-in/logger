import MESSAGES from './messages';
import * as CONSTANTS from './constants';
import { logger } from './Logger';

/**
 * @desc This function outputs a formatted log message to a console.
 *       [format]: DateTime FQDN LogLevel(Code) Message 
 * 
 * @param {String} arguments[0] - LogLevel
 * @param {String} arguments[1] - FQDN
 * @param {String} arguments[2] - DateTime
 * @param {Number} arguments[3] - Code
 * @param {String} arguments[4] - Message
 * @param {Array}  arguments[5] - inserts. Array of embedded parameters for String. Maximum length is 4.
 * @param {Array}  arguments[6] - numInserts. Array of embedded parameters for Number. Maximum length is 4.
 * @param {Array}  arguments[7] - timeInserts. Array of embedded parameters for DateTime. Maximum length is 4.
 * @param {String} arguments[8] - Language of the message（e.g. en-US, ja-JP）
 */
const logging = function() {
  const time = new Date(arguments[2]);
  var msgs = [
      toLocaleString(time)
    , arguments[1]
    , arguments[0] + '(' + arguments[3] + '):'
    ,logMessageFormat.apply(this, Array.prototype.slice.apply(arguments, [4, 8]))
  ];
  console.log(msgs.join(" "));
}

/**
 * @desc This function sets pad characters in a message.
 * 
 * @param {String} arguments[0] msg - Message
 * @param {Array}  arguments[1] - inserts. Array of embedded parameters for String. Maximum length is 4.
 * @param {Array}  arguments[2] - numInserts. Array of embedded parameters for Number. Maximum length is 4.
 * @param {Array}  arguments[3] - timeInserts. Array of embedded parameters for DateTime. Maximum length is 4.
 * @return {String}
 */
const formatRegExp = /%([1234%]|[dt][1234])/g;
const logMessageFormat = function(msg) {
  if (typeof msg !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(arguments[i].toString());
    }
    return objects.join(' ');
  }
  
  const maxStringLength = this.maxStringLength;
  const args = arguments;
  const str = String(msg).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    const type = x.substr(1,1);
    let index;
    switch (type) {
      case '1':
      case '2':
      case '3':
      case '4':
        index = x.substr(1,1) - 1;
        if (args[1] && Array.isArray(args[1]) && index < args[1].length) {
          let target = String(args[1][index]);
          if (maxStringLength != 0 && target.length > maxStringLength) {
             const truncatedLength = target.length - maxStringLength;
             target = `${target.substr(0, maxStringLength)}..(${truncatedLength}char truncated)`;
          }
          return target;
        } else {
          return x;   
        }
      case 'd':
        index = x.substr(2,1) - 1;
        return (args[2] && Array.isArray(args[2])  && index < args[2].length) ? (args[2][index] != null ? Number(args[2][index]) : null) : x;
      case 't':
        index = x.substr(2,1) - 1;
        let ret = x;
        if (args[3] && Array.isArray(args[3])  && index < args[3].length) {
          const time = new Date(args[3][index]);
          if (args[3][index] == null || args[3][index] == "Invalid Date") {
            ret = args[3][index];
          } else if (isNaN(time)) {
            ret = "";
          } else {
            ret = toLocaleString(time)
          }
        }
        return ret;
      default:
        return x;
    }
  });
  return str;
};

/**
 * @desc This function returns formatted datetime.  [format]: YYYY-MM-DD hh:mm:ss.SSS 
 * @param {Date} date - Target date 
 * @return {String} a string in the local time of this Date object.
 */
function toLocaleString(date) {
  const pad = (number) => {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  };
  return date.getFullYear()
    + "-" + pad(date.getMonth() + 1)
    + "-" + pad(date.getDate())
    + " " + pad(date.getHours())
    + ":" + pad(date.getMinutes())
    + ":" + pad(date.getSeconds())
    + '.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

/**
 * @desc Log Class. 
 * @class
 */
class Log {
  constructor(fqdn, logLevel, maxStringLength, logUploader, denyUpload) {
    if (logger) {
      logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['Log constructor']);
    } else {
      console.log(`${toLocaleString(new Date())} local.Logger.chip-in.net START Log constructor`);
    }
    this.fqdn = fqdn;
    this.logUploader = logUploader;
    this.denyUpload = denyUpload;
    this.setLogLevel(logLevel);
    this.setMaxStringLength(maxStringLength);
    if (logger) {
      logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['Log constructor']);
    } else {
      console.log(`${toLocaleString(new Date())} local.Logger.chip-in.net END Log constructor`);
    }
  }
  
  setLogLevel(logLevel) {
    this.logLevel = logLevel;
  }
  
  setMaxStringLength(maxStringLength) {
    this.maxStringLength = maxStringLength;
  }
  
  /**
   * @desc This function checks whether these parameters are valid.
   * @see critical for details of the parameters.
   * @return {boolean} Returns true if the parameters are valid.
   */
  _checkParam(code, message, inserts, numInserts, timeInserts, language) {
    let ret = {hasError: CONSTANTS.HASERROR_NONE, inserts, numInserts, timeInserts};
    // Check code parameter
    if (code == null) {
      ret.hasError = CONSTANTS.HASERROR_ERROR;
      logger.debug(MESSAGES.PARAMETER_NOT_FOUND.code, MESSAGES.PARAMETER_NOT_FOUND.msg, ['_checkParam', 'code']);
    } else if (!(Number.isInteger(code) && code >= 0)) {
      ret.hasError = CONSTANTS.HASERROR_ERROR;
      logger.debug(MESSAGES.WRONG_CODE.code, MESSAGES.WRONG_CODE.msg);
    }
    
    // Check message parameter
    if (!message) {
      ret.hasError = CONSTANTS.HASERROR_ERROR;
      logger.debug(MESSAGES.PARAMETER_NOT_FOUND.code, MESSAGES.PARAMETER_NOT_FOUND.msg, ['_checkParam', 'message']);
    } else if (typeof message !== 'string') {
      ret.hasError = CONSTANTS.HASERROR_ERROR;
      logger.debug(MESSAGES.WRONG_MESSAGE.code, MESSAGES.WRONG_MESSAGE.msg);
    }
    
    // Check inserts parameter
    if (inserts != null){
      if (Array.isArray(inserts)){
        for (let i = 0; i < inserts.length; i++) {
          const target = inserts[i];
          if (typeof target !== 'string' && target !== null) {
            ret.hasError = (ret.hasError < CONSTANTS.HASERROR_WARN) ? CONSTANTS.HASERROR_WARN : ret.hasError;
            ret.inserts[i] = "__Invalid_String__";
            logger.debug(MESSAGES.WRONG_INSERTS_ELEMENT.code, MESSAGES.WRONG_INSERTS_ELEMENT.msg);
          }
        }
      } else {
        ret.hasError = (ret.hasError < CONSTANTS.HASERROR_WARN) ? CONSTANTS.HASERROR_WARN : ret.hasError;
        ret.inserts = ["__Invalid_String__"];
        logger.debug(MESSAGES.WRONG_INSERTS.code, MESSAGES.WRONG_INSERTS.msg);
      }
    }
    
    // Check numInserts parameter
    if (numInserts != null){
      if (Array.isArray(numInserts)) {
        for (let i = 0; i < numInserts.length; i++) {
          const target = numInserts[i];
          if (!(Number.isInteger(target)) && target !== null) {
            ret.hasError = (ret.hasError < CONSTANTS.HASERROR_WARN) ? CONSTANTS.HASERROR_WARN : ret.hasError;
            ret.numInserts[i] = -2147483648;
            logger.debug(MESSAGES.WRONG_NUM_INSERTS_ELEMENT.code, MESSAGES.WRONG_NUM_INSERTS_ELEMENT.msg);
          }
        }
      } else {
        ret.hasError = (ret.hasError < CONSTANTS.HASERROR_WARN) ? CONSTANTS.HASERROR_WARN : ret.hasError;
        ret.numInserts = [-2147483648];
        logger.debug(MESSAGES.WRONG_NUM_INSERTS.code, MESSAGES.WRONG_NUM_INSERTS.msg);
      }
    }
    
    // Check timeInserts parameter
    const isDatetimeFormat = (target) => {
      let newDateString = null;
      if (target == null) {
         newDateString = target;
      } else if (typeof target !== 'string') {
         newDateString = "Invalid Date";
      } else {
        const time = Date.parse(target);
        if (isNaN(time)) {
           newDateString = "Invalid Date";
        } else {
           const dateObj = new Date(target);
           newDateString = dateObj.toISOString();
        }
      }
      return newDateString;
    }
    if (timeInserts != null){
      if (Array.isArray(timeInserts)) {
        for (let i = 0; i < timeInserts.length; i++) {
          const target = timeInserts[i];
          const newDateString = isDatetimeFormat(target);
          ret.timeInserts[i] = newDateString;
          if (newDateString == "Invalid Date") {
            ret.hasError = (ret.hasError < CONSTANTS.HASERROR_WARN) ? CONSTANTS.HASERROR_WARN : ret.hasError;
            logger.debug(MESSAGES.WRONG_DATE_INSERTS_ELEMENT.code, MESSAGES.WRONG_DATE_INSERTS_ELEMENT.msg);
          }
        }
      } else {
        ret.hasError = (ret.hasError < CONSTANTS.HASERROR_WARN) ? CONSTANTS.HASERROR_WARN : ret.hasError;
        ret.timeInserts = ["Invalid Date"];
        logger.debug(MESSAGES.WRONG_DATE_INSERTS.code, MESSAGES.WRONG_DATE_INSERTS.msg);
      }
    }

    // Check language parameter
    if (language != null && typeof language !== 'string') {
      ret.hasError = CONSTANTS.HASERROR_ERROR;
      logger.debug(MESSAGES.WRONG_LANGUAGE.code, MESSAGES.WRONG_LANGUAGE.msg);
    }
    return ret;
  }
  
  /**
   * @desc This function sends a log(JSON string) to the LogUploader.
   * @param {String} level - LogLevel
   * @param {String} time - DateTime
   * @see critical for details of the parameters other than the above.
   */
  _sendLogData(level, time, code, message, inserts, numInserts, timeInserts, language) {
    logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['_sendLogData']);
    const logData = {
      time
    , FQDN: this.fqdn
    , code
    , level
    , message
    , language
    , inserts
    , numInserts
    , timeInserts
    };
    const logDataJSON = JSON.stringify(logData);
    this.logUploader.putLog(logDataJSON);
    logger.trace(MESSAGES.SEND_LOG.code, MESSAGES.SEND_LOG.msg);
  }
  
  /**
   * @desc Output a log of critical errors. It means that the fatal error which can't continue giving the service occurred.
   *                                     
   * @param {Number} code        - Message Code
   * @param {String} message     - Message
   * @param {Array}  inserts     - Array of embedded parameters for String. Maximum length is 4.
   * @param {Array}  numInserts  - Array of embedded parameters for Number. Maximum length is 4.
   * @param {Array}  timeInserts -  Array of embedded parameters for DateTime. Maximum length is 4.
   * @param {String} language    - Language of the message（e.g. en-US, ja-JP）
   * @example
   * // exsample:
   * logger.critical(126, 'This is a sample log message. arg1=%d1 arg2=%1', ['XYZ'], [123], [], 'en-US');
   * // result:
   * 2018-03-11 11:23:45.234 v1-1.logger.chip-in.net Critical(126): This is a sample log message. arg1=123 arg2=XYZ
   */
  critical(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'critical', 'Critical');
  }
  
  /**
   * @desc Output a log of system errors. It means that an error occurred and the processing of a request was failed.
   * @see critical for details of the parameters.
   */
  error(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'error', 'Error');
  }
  
  /**
   * @desc Output a log of warning errors. It means that the processing of a request is succeed, 
   *       but there is a possibility some problems(e.g. System failure, Performance degradation, Non-compatibility) happen in the future.
   * @see critical for details of the parameters.
   */
  warn(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'warn', 'Warn');
  }
  
  /**
   * @desc Output a log of 'log' level. The phenomenon timing should be recorded as a system is output. (e.g. Start of service, End of service, Starting of a session, End of a session)
   * @see critical for details of the parameters.
   */
  log(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'log', 'Log');
  }
  
  /**
   * @desc Output a log of action informations. It means that the history of the action (e.g. user's operation / called API etc.) is recorded.
   * @see critical for details of the parameters.
   */
  info(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'info', 'Info');
  }
 
  /**
   * @desc Output a log for debugging. 
   *   e.g. - The error which occurred by the user's operation mistake
   *        - The error which occurred by a environment configuration mistake
   *        - Judgment result on the movement
   *        - Repeat count
   * @see critical for details of the parameters.
   */
  debug(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'debug', 'Debug');
  }
  
  /**
   * @desc Output a log for tracing. It means that trace information on processing for debugging is recorded.
   * @see critical for details of the parameters.
   */
  trace(code, message, inserts, numInserts, timeInserts, language) {
    return this._common(code, message, inserts, numInserts, timeInserts, language, 'trace', 'Trace');
  }
  
  /**
   * @desc The common function to output logs.
   * 
   * @param {String} methodName - Method name. This is also used as a key.
   * @param {String} methodDisplayName - Method name to display in log text.
   * @see critical for details of the others.
   */
  _common(code, message, inserts, numInserts, timeInserts, language, methodName, methodDisplayName) {
    const result = this._checkParam(code, message, inserts, numInserts, timeInserts, language);
    if (result.hasError == CONSTANTS.HASERROR_ERROR) {
      logger.debug(MESSAGES.FAILURE_OUTPUT_LOG.code, MESSAGES.FAILURE_OUTPUT_LOG.msg, [methodName, JSON.stringify({code, message, inserts, numInserts, timeInserts, language})]);
      return;
    }
    const time = (new Date()).toISOString();
    if (CONSTANTS.logLevelMap[methodName] <= this.logLevel) {
      logging.apply(this, [methodDisplayName, this.fqdn, time, code, message, result.inserts, result.numInserts, result.timeInserts, language]);
    }
    if (this.logUploader && !this.denyUpload && CONSTANTS.logLevelMap[methodName] <= this.logUploader.logLevelFilter) {
      this._sendLogData(CONSTANTS.logLevelMap[methodName], time, code, message, result.inserts, result.numInserts, result.timeInserts, language);
    }
  }
}

export { Log, toLocaleString };
