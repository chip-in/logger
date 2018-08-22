/**
 * @desc LoggerException. 
 */
const ExceptionMassages = {
  'WRONG_RESOURCENODE': '"resourceNode" isn\'t effective.',
  'FAILURE_GET_SERVICE': 'Failed to get a service of LogUploader. It doesn\'t exist or, more than one.',
  'EOD': 'End of data'
}

function LoggerException(code) {
   this.code = code;
   this.name = "LoggerException";
   this.message = function() {
      return ExceptionMassages[this.code];
   };
   this.toString = function() {
      return `[LoggerException]:${this.code}:${this.message}`;
   };
}

export default LoggerException;

