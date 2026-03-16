import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const winstonConfig = (): WinstonModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  const fileFormat = winston.format.combine(
    winston.format.uncolorize(),
    winston.format.timestamp(),
    winston.format.json(),
  );

  return {
    transports: [
      // Console transport (always enabled)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, trace }) => {
              return `${timestamp} [${level}] ${context ? '[' + context + '] ' : ''}${message}${trace ? '\n' + trace : ''}`;
            },
          ),
        ),
      }),

      // File transport (only in production)
      ...(isProduction
        ? [
            new winston.transports.DailyRotateFile({
              filename: 'logs/application-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              maxFiles: '14d',
              format: fileFormat,
            }),

            new winston.transports.DailyRotateFile({
              filename: 'logs/error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              maxFiles: '30d',
              level: 'error',
              format: fileFormat,
            }),
          ]
        : []),
    ],
  };
};
