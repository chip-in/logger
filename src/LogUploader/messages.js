/**
 * @desc LogUploader messages.
 */
const MESSAGES = {
  START_METHOD:               {code:  1, msg: 'START %1.'},
  END_METHOD:                 {code:  2, msg: 'END %1.'},
  PASS:                       {code:  3, msg: '[%1] PASS. %2=%3'}, // %1:MethodName, %2:displayName, %3: value
  WRONG_SESSIONID_NULL:       {code:  4, msg: '[registerSession] "sessionId" is required.'},
  WRONG_SESSIONID_INEFFECTIVE:{code:  5, msg: '[registerSession] "sessionId" isn\'t effective. sessionId=%1'}, // %1:Specified  value
  SEND_DONE_SESSION:          {code:  6, msg: '[registerSession] Registered the session.'},
  SEND_ERROR_SESSION:         {code:  7, msg: '[registerSession] Failed to register the session. ret=%1'}, // %1:Send data(JSON)
  WRONG_LOGDATA_NULL:         {code:  8, msg: '[putLog] "logData" is required.'},
  SESSIONID_NOTFOUND:         {code:  9, msg: '[putLog] Log wasn\'t registered because a sessionid wasn\'t registered yet.'},
  WRONG_LOGDATA_FORMAT:       {code: 11, msg: '[putLog] Failed to parse logData. logData=%1'}, // %1:Specified logData(JSON)
  SEND_DONE_MESSAGE:          {code: 12, msg: '[putLog] Registered the message.'},
  SEND_ERROR_MESSAGE:         {code: 13, msg: '[putLog] Failed to register the message. message=%1'}, // %1:Send data(JSON)
  SEND_DONE_LOG:              {code: 14, msg: '[putLog] Registered the log.'},
  SEND_ERROR_LOG:             {code: 15, msg: '[putLog] Failed to register the log. sessionid=%1'}, // %1:sessionid
  FAILED_CSV_LOGDATA:         {code: 16, msg: '[getCsvLog] Failed to getCsvLog. detail=%1'}, // %1:error
  SEND_DONE:                  {code: 17, msg: '[send] Succeeded to send. url=%1'},
  SEND_ERROR:                 {code: 18, msg: '[send] Failed to send. url=%1, error=%2'},
  WRONG_VALUE_AND_CONTINUE:   {code: 19, msg: '[constructor] The "%1" value is incorrect or not specified. %1=%2. The "%1" is regarded as %3 and processing is continued.'},  // %1:ParameterName, %2:Defined value, %3: New value

  EOD: {code: -1, msg: 'End of data'}
}

export default MESSAGES;
