/**
 * @desc Constants used by Logger API.
 */
const logLevelMap = {
  "critical": 1,
  "error": 2,
  "warn": 3,
  "log": 4,
  "info": 5,
  "debug": 6,
  "trace": 7
}

const HASERROR_NONE = 0;
const HASERROR_WARN = 1;
const HASERROR_ERROR = 9;

export { logLevelMap, HASERROR_NONE, HASERROR_ERROR, HASERROR_WARN };
