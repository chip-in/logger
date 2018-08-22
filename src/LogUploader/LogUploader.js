import { ServiceEngine } from "@chip-in/resource-node";
import { Logger } from '../Logger/Logger';
import _ from 'lodash';
import zlib from 'zlib';
import * as csv from "csv";
import assert from 'assert';
import MESSAGES from './messages';
import LogUploaderException from './LogUploaderException';
import p from '../../package';

/**
 * @class LogUploader
 * @classdesc LogUploader is a service engine on ResourceNode. It sends logs received from Logger API to LogAggregateServer on CoreNode.
 */
const defaultValueLogLevelFilter = 5;
const defaultValueMaxStringLength = 1024;
const defaultValueMaxBufferingSize = 10000;
const defaultValueMaxLatency = 600;
const defaultValueMergeThreshHold = 1000;
 
class LogUploader extends ServiceEngine  {
  constructor(option) {
    super();
    this.node = null;
    this.config = option.metadata;
    
    // Logger Configuration
    this.logger = Logger._getLogger_internal(`${p.version}.LogUploader.logger.chip-in.net`, true);
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['LogUploader.constructor']);
    
    // LogUploader Configuration
    this.logLevelFilter = this.config && this.config.uploaderParameters && this.config.uploaderParameters.logLevelFilter || defaultValueLogLevelFilter;
    this.maxStringLength = this.config && this.config.uploaderParameters && this.config.uploaderParameters.maxStringLength || defaultValueMaxStringLength;
    this.maxBufferingSize = this.config && this.config.uploaderParameters && this.config.uploaderParameters.maxBufferingSize || defaultValueMaxBufferingSize;
    this.maxLatency = this.config && this.config.uploaderParameters && this.config.uploaderParameters.maxLatency || defaultValueMaxLatency;
    this.mergeThreshHold = this.config && this.config.uploaderParameters && this.config.uploaderParameters.mergeThreshHold || defaultValueMergeThreshHold;
    
    this.sessionId = null;
    this.registeredMessages = {};
    this.unsentLogs = [];
    this.waitId = null;
    
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['LogUploader.constructor']);
  }
  
  /**
   * @desc Registers the default service class on ResouceNode.
   * @param {Object} ResouceNode
   */
  static registerServiceClasses(node) {
    console.log("PASS LogUploader.logger.chip-in.net registerServiceClasses");
    node.registerServiceClasses({
      LogUploader
    });
  }
  
  start(node) {
    this.node = node;
    return Promise.resolve()
  }
  
  /**
   * @desc Registers a session using LogAggregateServer API.
   * @param {String} sessionid - A sessionid created by Logger API
   * @throws {LogUploaderException}
   */
  registerSession(sessionId) {
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['registerSession']);
    if (sessionId == null) {
      this.logger.debug(MESSAGES.WRONG_SESSIONID_NULL.code, MESSAGES.WRONG_SESSIONID_NULL.msg);
      throw new LogUploaderException("ERR_SESSIONID_NULL");
    } else if (!this._isSessionID(sessionId)) {
      this.logger.debug(MESSAGES.WRONG_SESSIONID_INEFFECTIVE.code, MESSAGES.WRONG_SESSIONID_INEFFECTIVE.msg, [sessionId.toString()]);
      throw new LogUploaderException("ERR_SESSIONID_INEFFECTIVE");
    }
    this.sessionId = sessionId;
    const context = this.node.getContext();
    
    const sessionData = {
      sessionId,
      startTime: (new Date()).toISOString(),
      nodeClass: context['net.chip-in.node-class'] || null,
      nodeName: context['net.chip-in.node-id'] || null,
      uid: context['net.chip-in.uid'] || null,
      org: context['net.chip-in.org'] || null,
      dev: context['net.chip-in.dev'] || null,
      ua: context['net.chip-in.ua'] || null
      // The other attributes are set on the server side.
    };
    // HTTP POST
    this._send('/l/sessions', sessionData)
    .then(ret => {
      if (ret == 0) {
        this.logger.trace(MESSAGES.SEND_DONE_SESSION.code, MESSAGES.SEND_DONE_SESSION.msg);
      } else {
        this.logger.debug(MESSAGES.SEND_ERROR_SESSION.code, MESSAGES.SEND_ERROR_SESSION.msg, [JSON.stringify(sessionData)]);
        throw new LogUploaderException("FAILURE_REGISTER_SESSION");
      }
    })
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['registerSession']);
  }
  _isSessionID(sessionId) {
    if (typeof sessionId !== 'string') {
      return false;
    }
    const decodeSessionid = window.atob(sessionId);
    if (!(/[0-9]{6}/.test(decodeSessionid))) {
      return false;
    }
    return true;
  }
  
  /**
   * @desc Registers a log using LogAggregateServer API.
   * @param {String} logData - Log (a valid JSON string)
   * @throws {(LogUploaderException|Exception)}
   */
  putLog(logData) {
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['putLog']);
    if (logData == null) {
      this.logger.debug(MESSAGES.WRONG_LOGDATA_NULL.code, MESSAGES.WRONG_LOGDATA_NULL.msg);
      throw new LogUploaderException("ERR_NULL");
    }
    if (this.sessionId == null) {
      this.logger.debug(MESSAGES.SESSIONID_NOTFOUND.code, MESSAGES.SESSIONID_NOTFOUND.msg);
      throw new LogUploaderException("ERR_SESSIONID_NO_REGISTER");
    }

    let logObject = null;
    try {
      logObject = JSON.parse(logData);
    } catch(e) {
      this.logger.debug(MESSAGES.WRONG_LOGDATA_FORMAT.code, MESSAGES.WRONG_LOGDATA_FORMAT.msg, [logData.toString()]);
      throw e;
    }
    
    // messages
    let doRegisterMessage = false;
    if ((!this.registeredMessages[`${logObject.FQDN}:${logObject.code}:${logObject.language||"en-US"}`]) || 
        (this.registeredMessages[`${logObject.FQDN}:${logObject.code}:${logObject.language||"en-US"}`] != logObject.message)) {
      doRegisterMessage = true;
    }
    if (doRegisterMessage) {
      const messageData = {
        FQDN: logObject.FQDN,
        code: logObject.code,
        language: logObject.language || "en-US",
        message: logObject.message
      };
      // HTTP POST
      this._send('/l/messages', messageData)
      .then(ret => {
        if (ret == 0) {
          this.registeredMessages[`${messageData.FQDN}:${messageData.code}:${messageData.language||"en-US"}`] = messageData.message;
          this.logger.trace(MESSAGES.SEND_DONE_MESSAGE.code, MESSAGES.SEND_DONE_MESSAGE.msg);
        } else {
          this.logger.debug(MESSAGES.SEND_ERROR_MESSAGE.code, MESSAGES.SEND_ERROR_MESSAGE.msg, [JSON.stringify(messageData)]);
          throw new LogUploaderException("FAILURE_REGISTER_MESSAGE");
        }
      })
    }
    
    // logs
    this.unsentLogs.push(logObject);
    if (this.unsentLogs.length < this.maxBufferingSize) {
      if (this.waitId == null) {
        this._setWaiting();
      }
    } else {
      this._doFlash();
    }
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['putLog']);
  }
  
  /**
   * @desc Flashes logs. When "maxLatency" time passes, the log accumulated by buffering is sent to the server.
   */
  _setWaiting() {
    const startDate = new Date(this.unsentLogs[0].time);
    const now = new Date();
    const interval = this.maxLatency * 1000;
    this.waitId = setTimeout(this._doFlash.bind(this), interval);
  }
  
  /**
   * @desc createTimeout.
   */
  _clearWaiting() {
    if (this.waitId != null) {
      clearTimeout(this.waitId);
      this.waitId = null;
    }
  }
  
  /**
   * @desc aggregates and merges logs.
   * @param {Object} logObject - A log Object
   */
  _doFlash() {
    this.logger.trace(MESSAGES.START_METHOD.code, MESSAGES.START_METHOD.msg, ['_doFlash']);
    const targetLogs = _.cloneDeep(this.unsentLogs);
    this.unsentLogs = [];
    this._clearWaiting();
    
    this._merge(targetLogs)
    .then(mergedLog => this._getCsvLog(mergedLog))
    .then(compressedLog => {
      const param = {
        sessionId: this.sessionId,
        csvLog: compressedLog
      };
      // HTTP POST
      this._send('/l/logs', param)
      .then(ret => {
        if (ret == 0) {
          this.logger.trace(MESSAGES.SEND_DONE_LOG.code, MESSAGES.SEND_DONE_LOG.msg);
        } else {
          this.logger.debug(MESSAGES.SEND_ERROR_LOG.code, MESSAGES.SEND_ERROR_LOG.msg, [param.sessionId]);
          throw new LogUploaderException("FAILURE_REGISTER_LOG");
        }
      });
    });
    this.logger.trace(MESSAGES.END_METHOD.code, MESSAGES.END_METHOD.msg, ['_doFlash']);
    return;
  }
  
  /**
   * @desc Merges logs. 
   *       When log of the same contents is repeating it beyond "mergeThreshHold", information is compressed to give the number of time and the time into 1 record.
   * @param {Object} logsObject - logs Object
   * @return {Promise<Array>}
   */
  _merge(logsObject) {
    return Promise.resolve()
    .then(()=>{
      let mergedLogs = [];
      let mergedLogsJson = [];
      
      for (let i = 0; i < logsObject.length; i++) {
        const targetLog = logsObject[i];
        
        let matchIndex = null;
        if (this.mergeThreshHold != 0) { // 0: Do not merge
          for (let j = 0; j < mergedLogs.length; j++) {
            const mergedLog = mergedLogs[j];
            if (mergedLog.mergeCount < this.mergeThreshHold && this._isSameContents(targetLog, mergedLogsJson[j])) {
              matchIndex = j;
              break;
            }
          }
        }
        if (matchIndex == null) {
          mergedLogs.push(this._setLogRecord(targetLog, 1, targetLog.time, targetLog.time));
          mergedLogsJson.push(targetLog);
        } else {
          const updateMergedLog = _.cloneDeep(mergedLogs[matchIndex]);
          updateMergedLog.mergeCount++;
          updateMergedLog.endTime = targetLog.time;
          mergedLogs.splice(matchIndex, 1, updateMergedLog);
        }
      }
      return mergedLogs;
    });
  }
  
  _isSameContents(targetLog, log) {
    let prevLog = _.cloneDeep(targetLog);
    let nextLog = _.cloneDeep(log);
    delete prevLog.time;
    delete nextLog.time;
    try {
      assert.deepStrictEqual(prevLog, nextLog);
    } catch(e) {
      return false;
    }
    return true;
  }
  
  _setLogRecord(log, mergeCount, startTime, endTime) {
    const ret = {
      startTime,
      mergeCount,
      endTime,
      FQDN:	     log.FQDN,
      code:	     log.code,
      level:	 log.level,
      string1:   log.inserts && log.inserts[0] != null? this._truncated(log.inserts[0]) : null,
      string2:   log.inserts && log.inserts[1] != null? this._truncated(log.inserts[1]) : null,
      string3:   log.inserts && log.inserts[2] != null? this._truncated(log.inserts[2]) : null,
      string4:   log.inserts && log.inserts[3] != null? this._truncated(log.inserts[3]) : null,
      integer1:  log.numInserts && log.numInserts[0] != null? log.numInserts[0] : null,
      integer2:  log.numInserts && log.numInserts[1] != null? log.numInserts[1] : null,
      integer3:  log.numInserts && log.numInserts[2] != null? log.numInserts[2] : null,
      integer4:  log.numInserts && log.numInserts[3] != null? log.numInserts[3] : null,
      timstamp1: log.timeInserts && log.timeInserts[0] != null? log.timeInserts[0] : null,
      timstamp2: log.timeInserts && log.timeInserts[1] != null? log.timeInserts[1] : null,
      timstamp3: log.timeInserts && log.timeInserts[2] != null? log.timeInserts[2] : null,
      timstamp4: log.timeInserts && log.timeInserts[3] != null? log.timeInserts[3] : null
    };
    return ret;
  }
  
  _truncated(embeddedData) {
    let target = embeddedData;
    if (this.maxStringLength != 0 && target.length > this.maxStringLength) {
       const truncatedLength = target.length - this.maxStringLength;
       target = `${target.substr(0, this.maxStringLength)}..(${truncatedLength}char truncated)`;
    }
    return target;
  }
  
  /**
   * @desc This function compresses the log data of CSV format using gzip, and returns a Base64 encoded string.
   * @return {Promise<String>}
   */
  _getCsvLog(targetLogs) {
    const csvColumns = {
      startTime: "startTime",
      mergeCount: "mergeCount",
      endTime: "endTime",
      FQDN: "FQDN",
      code: "code",
      level: "level",
      string1: "string1",
      string2: "string2",
      string3: "string3",
      string4: "string4",
      integer1: "integer1",
      integer2: "integer2",
      integer3: "integer3",
      integer4: "integer4",
      timstamp1: "timstamp1",
      timstamp2: "timstamp2",
      timstamp3: "timstamp3",
      timstamp4: "timstamp4"
    };
    
    return Promise.resolve()
    .then(()=>{
      // JSON Object to CSV
      return new Promise((resolve, reject) => {
        csv.stringify(targetLogs, { header: false, columns: csvColumns }, function(err, output){
          if (err != null) {
            reject(`[csv.stringify error]${err}`);
          } else {
            resolve(output)
          }
        });
      });
    })
    .then((outputCSV)=>{
      // Compress
      return new Promise((resolve, reject) => {
        zlib.gzip(outputCSV, function (err, binary) {
          if (err != null) {
            reject(`[zlib.gzip error] code=${err.code}, errno=${err.errno}, message=${err.message}`);
          } else {
            resolve(binary)
          }
        });
      });
    })
    .then((outputGzip)=>{
      // Base64 encode
      const output = Buffer.from(outputGzip);
      return output.toString('base64');
    })
    .catch((e)=>{
      this.logger.trace(MESSAGES.FAILED_CSV_LOGDATA.code, MESSAGES.FAILED_CSV_LOGDATA.msg, [e.toString()]);
      return null;
    });
  }
  
  /**
   * @desc sends data to LogAggregateServer.
   * @param {String} url - URL of LogAggregateServer
   * @param {Object} sendData -  Post data Object
   * @return {Promise<fetch>}
   */
  _send(url, sendData) {
    const options = {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendData)
    };
    return this.node.fetch(url, options)
      .then(resp => resp.json())
      .then(json => {
        if (json == null || json.retCode !== 0) {
          this.logger.debug(MESSAGES.SEND_ERROR.code, MESSAGES.SEND_ERROR.msg, [url, JSON.stringify(json)]);
          return -1;
        } else {
          this.logger.trace(MESSAGES.SEND_DONE.code, MESSAGES.SEND_DONE.msg, [url]);
        }
        return 0;
      })
      .catch((e)=>{
        this.logger.error(MESSAGES.SEND_ERROR.code, MESSAGES.SEND_ERROR.msg, [url, e.toString()]);
        return -1;
      })
  }
}

export default LogUploader;
