module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest/setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@tanstack)/)',
  ],
};
