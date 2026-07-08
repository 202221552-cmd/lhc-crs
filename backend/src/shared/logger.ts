import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      }
    : undefined,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, params: req.params }),
    res: (res) => ({ statusCode: res.statusCode }),
    err: pino.stdSerializers.err,
  },
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.passwordHash'],
});
