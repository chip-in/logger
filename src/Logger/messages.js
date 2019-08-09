/**
 * @desc Log messages.
 */
const MESSAGES = {
  START_METHOD:               {code:  1, msg: 'START %1.'},
  END_METHOD:                 {code:  2, msg: 'END %1.'},
  PASS:                       {code:  3, msg: '[%1] PASS. %2=%3'}, // %1:MethodName, %2:displayName, %3: value
  PARAMETER_NOT_FOUND:        {code:  4, msg: '[%1] The "%2" parameter is required.'},  // %1:MethodName, %2:ParameterName
  WRONG_VALUE:                {code:  5, msg: '[%1] The "%2" value is wrong. %2=%3.'},  // %1:MethodName, %2:ParameterName, %3:Defined value
  WRONG_VALUE_AND_CONTINUE:   {code:  6, msg: '[%1] The "%2" value is wrong. %2=%3. The "%2" is regarded as %4 and processing is continued.'},  // %1:MethodName, %2:ParameterName, %3:Defined value, %4: New value
  WRONG_RESOURCENODE:         {code:  7, msg: '[attachUploader] "resourceNode" isn\'t effective.'},
  SESSIONID_ALREADY_EXISTS:   {code:  8, msg: '[attachUploader] The sessionid is registered with LogUploader already. sessionid=%1'},
  FAILURE_GET_SERVICE:        {code:  9, msg: '[attachUploader] Failed to get a service of LogUploader. It exists more than one. length=%d1'},
  ATTACH_UPLOADER:            {code: 10, msg: '[attachUploader] Attached LogUploader. sessionid=%1'},
  CREATED_NEW_INSTANCE:       {code: 11, msg: '[getLogger] Created a new instance. fqdn=%1, logLevel=%d1, maxStringLength=%d2, denyUpload=%2'},
  
  WRONG_CODE:                 {code: 12, msg: '[checkParam] The "code" parameter has to be an integer bigger than 0.'},
  WRONG_MESSAGE:              {code: 13, msg: '[checkParam] The "message" parameter has to be a string.'},
  WRONG_INSERTS_ELEMENT:      {code: 14, msg: '[checkParam] An element of "inserts" parameter has to be a string.'},
  WRONG_INSERTS:              {code: 15, msg: '[checkParam] "inserts" parameter has to be an array.'},
  WRONG_NUM_INSERTS_ELEMENT:  {code: 16, msg: '[checkParam] An element of "numInserts" parameter has to be a integer.'},
  WRONG_NUM_INSERTS:          {code: 17, msg: '[checkParam] "numInserts" parameter has to be an array.'},
  WRONG_DATE_INSERTS_ELEMENT: {code: 18, msg: '[checkParam] An element of "timeInserts" parameter has to be a string of the form of the date and time.'},
  WRONG_DATE_INSERTS:         {code: 19, msg: '[checkParam] "timeInserts" parameter has to be an array.'},
  WRONG_LANGUAGE:             {code: 20, msg: '[checkParam] "language" parameter has to be a string.'},
  FAILURE_OUTPUT_LOG:         {code: 21, msg: '[%1] This log wasn\'t output, because there were several errors in a parameter check. parameters=%2'},  // %1:MethodName, %2:Parameters(JSON)
  SEND_LOG:                   {code: 22, msg: '[sendLogData] Sent a log to LogUploader.'},
  
  FAILURE_GET_SERVICE_NOTFOUND: {code: 23, msg: '[attachUploader] Failed to get a service of LogUploader. It doesn\'t exist. length=%d1'},

  EOD: {code: -1, msg: 'End of data'}
}

export default MESSAGES;
