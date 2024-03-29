import { ResourceNode, ServiceEngine } from "@chip-in/resource-node";

export class Logger {
  static getLogger(fqdn: string): Log;
  /**
   * @param logLevel Set logLevel numerically or by name. The name that can be specified are 'critical', 'error', 'warn', 'log', 'info', 'debug' and 'trace'. The number can be specified from 1 to 7, and the values are in the order in which the names are written. e.g. 3 means 'warn'. The default is 3.
   */
  static setLogLevel(logLevel: number | LogLevel): void;
  static setMaxStringLength(maxStringLength: number): void;
  static attachUploader(resourceNode: ResourceNode): void;
  /**
   * @example
   * // exsample:
   * const inserts1 = 'XYZ';
   * const inserts2 = 'abc';
   * const timeInserts1 = '2022-07-25 11:21:12.859';
   * const embeddedMessage = Logger.format('This is a sample message. number=%d1 string=%1:%2 date=%t1', [inserts1, inserts2], [123], [timeInserts1]);
   * console.log(embeddedMessage);
   * // result:
   * This is a sample message. number=123 string=XYZ:abc date=2022-07-25 11:21:12.859
   */
  static format(msg: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>): string;
}
export class Log {
  critical(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
  error(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
  warn(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
  log(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
  info(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
  debug(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
  trace(code: number, message: string, inserts?: Array<string>, numInserts?: Array<number>, timeInserts?: Array<string>, language?: string): void;
}
export class LogUploader extends ServiceEngine {
  constructor(option?: {})
  start(node: ResourceNode): Promise<void>;
  stop(node: ResourceNode): Promise<void>;
  static registerServiceClasses(node: ResourceNode);
  registerSession(sessionId: string);
  putLog(logData: string)
}

type LogLevel = 'critical' | 'error' | 'warn' | 'log' | 'info'| 'debug' | 'trace'
