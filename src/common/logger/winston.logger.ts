import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const logDir = 'logs';

// 파일용 포맷 (컨텍스트 포함)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.ms(),
  winston.format.printf((info) => {
    const timestamp = typeof info.timestamp === 'string' ? info.timestamp : '';
    const level =
      typeof info.level === 'string' ? info.level.toUpperCase() : 'INFO';
    const message = typeof info.message === 'string' ? info.message : '';
    const context = typeof info.context === 'string' ? `[${info.context}]` : '';
    const ms = typeof info.ms === 'string' ? info.ms : '';
    return `${timestamp} [${level}] ${context} ${message} ${ms}`;
  }),
);

// 일반 로그 파일 설정 (모든 레벨)
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'log-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '180d', // 180일 보관
  level: 'verbose',
  format: fileFormat,
});

// 에러 로그 파일 설정 (에러만 따로)
const errorRotateFileTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '180d', // 180일 보관
  level: 'error',
  format: fileFormat,
});

// 프로덕션 여부 확인
const isProduction = process.env.NODE_ENV === 'production';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: isProduction ? 'log' : 'verbose',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('BookJourney', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    dailyRotateFileTransport,
    errorRotateFileTransport,
  ],
});
