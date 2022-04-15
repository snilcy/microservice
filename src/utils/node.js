const NODE_ENV = process.env.NODE_ENV;
export const isTestNodeEnv = NODE_ENV === 'test';
export const isDevNodeEnv = NODE_ENV === 'development';
export const isProdNodeEnv = NODE_ENV === 'production';
