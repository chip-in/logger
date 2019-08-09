import { Log, toLocaleString } from './Log';
import MESSAGES from './messages';
import * as CONSTANTS from './constants';
import LoggerException from './LoggerException';
import p from '../../package';

/**
 * @desc Logger Class. This class supports the following functions.
 *       - Outputs logs of a text format.
 *       - Sends logs to the LogUploader.
 */
const defaultValueLogLevel = 3;
const defaultValueMaxStringLength = 1024;

class Logger {
  /**
   * @desc Defines and initializes the properties of the class.
   */
  logLevel;
  maxStringLength;
  instanceMap;
  sessionid;
  logUploader;
  logger;
  
  static _setInitialValue() {
    if (!this.logger && logger) {
      this.logger = logger;
    }
    if (this.logLevel != undefined) return;
    this.logLevel = defaultValueLogLevel;
    this.maxStringLength = defaultValueMaxStringLength;
    this.instanceMap = {};
    this.sessionid = null;
    this.logUploader = null;
  }

  /**
   * @desc Returns a instance for outputting logs.  FQDN parameter is output as a log element.
   * @param {String} fqdn - FQDN
   * @return {Object} instance or null
   */
  static getLogger(fqdn) {
    return this._getLogger_internal(fqdn, false);
  }
  static _getLogger_internal(fqdn, denyUpload) {
    this._setInitialValue();
    if (this.logger) {
      this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['getLogger']);
    } else {
      console.log(`${toLocaleString(new Date())} ${p.version}.local.Logger.chip-in.net START getLogger`);
    }
    if (fqdn == null) {
      if (this.logger) {
        this.logger.error(MESSAGES.PARAMETER_NOT_FOUND.code, MESSAGES.PARAMETER_NOT_FOUND.msg, ['getLogger', 'fqdn']);
      } else {
        console.log(`${toLocaleString(new Date())} ${p.version}.local.Logger.chip-in.net [getLogger] The "fqdn" parameter is required.`);
      }
      return null;
    }
    
    if (!this.instanceMap[fqdn]) {
      if (this.logger) {
        this.logger.info(MESSAGES.CREATED_NEW_INSTANCE.code, MESSAGES.CREATED_NEW_INSTANCE.msg, [fqdn, denyUpload.toString()], [this.logLevel, this.maxStringLength]);
      } else {
        console.log(`${toLocaleString(new Date())} ${p.version}.local.Logger.chip-in.net [getLogger] Created a new instance. fqdn=${fqdn}, logLevel=${this.logLevel}, maxStringLength=${this.maxStringLength}, denyUpload=${denyUpload.toString()}`);
      }
      this.instanceMap[fqdn] = new Log(fqdn, this.logLevel, this.maxStringLength, this.logUploader, denyUpload);
    }
    if (this.logger) {
      this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['getLogger']);
    } else {
      console.log(`${toLocaleString(new Date())} ${p.version}.local.Logger.chip-in.net END getLogger`);
    }
    return this.instanceMap[fqdn];
  }
  
  /**
   * @desc Set logLevel. 
   * @param {(String|Number)} logLevel - Possible values are: 'critical', 'error', 'warn', 'log', 'info', 'debug', 'trace', 1 to 7. Default is 3.
   */
  static setLogLevel(logLevel) {
    this._setInitialValue();
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['setLogLevel']);
    const isLogLevel = (logLevel) =>{
      let ret = -1;
      if (logLevel) {
        if (Number.isInteger(logLevel) && logLevel >= 1 && logLevel <= 7) {
          ret = logLevel;
        } else if (CONSTANTS.logLevelMap[logLevel]) {
          ret = CONSTANTS.logLevelMap[logLevel];
        }
      }
      this.logger.debug(MESSAGES.PASS.code, MESSAGES.PASS.msg, ['isLogLevel', 'ret', ret != null && ret.toString() || "null"]);
      return ret;
    }

    if (logLevel && !Number.isInteger(logLevel) && !Number.isNaN(Number(logLevel))) {
      logLevel = Number(logLevel);
    }
    const level = isLogLevel(logLevel);
    if (level != -1) {
      this.logLevel = level;
    } else {
      this.logLevel = defaultValueLogLevel;
      this.logger.debug(MESSAGES.WRONG_VALUE_AND_CONTINUE.code, MESSAGES.WRONG_VALUE_AND_CONTINUE.msg,
        ['setLogLevel', 'logLevel', logLevel != null && logLevel.toString() || "null", this.logLevel.toString()]);
    }
    // Update instances
    const instanceKeys = Object.keys(this.instanceMap);
    for (let i = 0; i < instanceKeys.length; i++) {
      this.logger.debug(MESSAGES.PASS.code, MESSAGES.PASS.msg, ['setLogLevel(Update instances)', 'logLevel', this.logLevel.toString()]);
      this.instanceMap[instanceKeys[i]].setLogLevel(this.logLevel);
    }
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['setLogLevel']);
  }
  
  /**
   * @desc Set a threshold value to truncate a long message. The threshold 0 isn't truncated. 
   * @param {Number} maxStringLength - Integer of more than 0. Default is 1024.
   */
  static setMaxStringLength(maxStringLength) {
    this._setInitialValue();
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['setMaxStringLength']);
    if (maxStringLength && !Number.isInteger(maxStringLength) && !Number.isNaN(Number(maxStringLength))) {
      maxStringLength = Number(maxStringLength);
    }
    if (maxStringLength != null && Number.isInteger(maxStringLength) && maxStringLength >= 0) {
      this.maxStringLength = maxStringLength;
    } else {
      this.maxStringLength = defaultValueMaxStringLength;
      this.logger.debug(MESSAGES.WRONG_VALUE_AND_CONTINUE.code, MESSAGES.WRONG_VALUE_AND_CONTINUE.msg,
        ['setMaxStringLength', 'maxStringLength', maxStringLength != null && maxStringLength.toString() || "null", this.maxStringLength.toString()]);
    }
    // Update instances
    const instanceKeys = Object.keys(this.instanceMap);
    for (let i = 0; i < instanceKeys.length; i++) {
      this.logger.debug(MESSAGES.PASS.code, MESSAGES.PASS.msg, ['setMaxStringLength(Update instances)', 'maxStringLength', this.maxStringLength.toString()]);
      this.instanceMap[instanceKeys[i]].setMaxStringLength(this.maxStringLength);
    }
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['setMaxStringLength']);
  }

  /**
   * @desc This method connects to the uploader. Logs after carrying out this method are uploaded to CoreNode by the uploader.
   * @param {Object} resourceNode - Effective ResourceNode instance
   * @return {boolean} Returns true if attaching is successful
   * @throws {LoggerException}
   */
  static attachUploader(resourceNode) {
    this._setInitialValue();
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['attachUploader']);
    if (!resourceNode || !resourceNode.searchServiceEngine) {
      this.logger.error(MESSAGES.WRONG_RESOURCENODE.code, MESSAGES.WRONG_RESOURCENODE.msg);
      throw new LoggerException("WRONG_RESOURCENODE");
    }
    if (this.sessionid) {
      this.logger.info(MESSAGES.SESSIONID_ALREADY_EXISTS.code, MESSAGES.SESSIONID_ALREADY_EXISTS.msg, [this.sessionid]);
      return true; // registered already
    }
    
    const pad6 = (number) => {
      return ('000000' + number).slice(-6);
    };
    const seList = resourceNode.searchServiceEngine("LogUploader");
    if (seList.length == 1) {
      this.logUploader = seList[0];
      const sessionid = pad6(Math.floor(Math.random() * 1000000));
      this.sessionid = btoa(sessionid);
      this.logger.log(MESSAGES.ATTACH_UPLOADER.code, MESSAGES.ATTACH_UPLOADER.msg, [this.sessionid]);
      this.logUploader.registerSession(this.sessionid);
      
      // Update instances
      const instanceKeys = Object.keys(this.instanceMap);
      for (let i = 0; i < instanceKeys.length; i++) {
        this.logger.debug(MESSAGES.PASS.code, MESSAGES.PASS.msg, ['attachUploader(Update instances)', 'instanceKey(FQDN)', instanceKeys[i]]);
        this.instanceMap[instanceKeys[i]].logUploader = this.logUploader;
      }
    } else if (seList.length == 0) {
      this.logger.warn(MESSAGES.FAILURE_GET_SERVICE_NOTFOUND.code, MESSAGES.FAILURE_GET_SERVICE_NOTFOUND.msg, null, [seList.length]);
      return false; // LogUploader doesn't exist
    } else {
      this.logger.error(MESSAGES.FAILURE_GET_SERVICE.code, MESSAGES.FAILURE_GET_SERVICE.msg, null, [seList.length]);
      throw new LoggerException("FAILURE_GET_SERVICE");
    }
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['attachUploader']);
    return true;
  }
}

function btoa(str) {  
  var buffer;
  if (Buffer.isBuffer(str)) {
    buffer = str;
  }
  else {
    buffer = new Buffer(str.toString(), 'binary');
  }

  return buffer.toString('base64');
};

const logger = Logger._getLogger_internal(`${p.version}.Logger.logger.chip-in.net`, true);

export { Logger, logger };
