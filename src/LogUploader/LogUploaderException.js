/**
 * @desc LogUploaderException. 
 */
const ExceptionMassages = {
  'ERR_NULL': 'The argument is null.',
  'ERR_SESSIONID_NO_REGISTER': 'A sessionId isn\'t registered yet.',
  'ERR_SESSIONID_NULL': 'The sessionId is null.',
  'ERR_SESSIONID_INEFFECTIVE': 'The sessionId isn\'t effective.',
  'FAILURE_REGISTER_SESSION': 'It failed to register the session.',
  'FAILURE_REGISTER_MESSAGE': 'It failed to register the message.',
  'FAILURE_REGISTER_LOG': 'It failed to register the log.',
  
  'EOD': 'End of data'
}

function LogUploaderException(code) {
   this.code = code;
   this.name = "LogUploaderException";
   this.message = function() {
      return ExceptionMassages[this.code];
   };
   this.toString = function() {
      return `[LogUploaderException]:${this.code}:${this.message}`;
   };
}

export default LogUploaderException;

