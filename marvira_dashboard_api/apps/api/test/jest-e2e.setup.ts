// Applied before AppModule loads so e2e tests skip anti-cheat speed checks.
process.env.NODE_ENV = 'test';
process.env.REDIS_DISABLED = 'true';
