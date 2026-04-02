import { configMessages } from './data';

export const getCorstOptions = () => {
  const whitelist: string[] = process.env.CORS_WHITE_LIST.split(',');
  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      try {
        if (whitelist.includes(origin)) {
          callback(null, true);
        } else {
          throw new Error(configMessages.cors.notAllowedCors);
        }
      } catch (error) {
        callback(error);
      }
    },
    credentials: true,
  };
};
