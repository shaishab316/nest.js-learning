import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      ttl: 60, // Time to live in seconds
      limit: 10, // Maximum number of requests within TTL
    },
  ],
  errorMessage: 'Too many requests. Please try again later.',
  skipIf: () => {
    return process.env.NODE_ENV === 'development'; // Skip throttling in development environment
  },
};
