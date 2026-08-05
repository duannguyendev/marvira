/**
 * Load marvira_mobile/.env.local into process.env when a key is not already set.
 * Codemagic ENV wins; local file fills gaps. Used by Metro/Babel at bundle time.
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local'));

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@api': './src/api',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@services': './src/services',
          '@store': './src/store',
          '@utils': './src/utils',
          '@types': './src/types',
          '@theme': './src/theme',
        },
      },
    ],
    [
      'transform-inline-environment-variables',
      {
        include: [
          'API_BASE_URL',
          'API_BASE_URL_LOCAL',
          'API_BASE_URL_UAT',
          'API_BASE_URL_PRODUCTION',
          'API_ENV',
          'MARKETING_SITE_URL',
          'GOOGLE_WEB_CLIENT_ID',
          'FACEBOOK_APP_ID',
          'FACEBOOK_CLIENT_TOKEN',
        ],
      },
    ],
    // Reanimated 4's plugin is an alias of worklets; include only one (must be last).
    'react-native-worklets/plugin',
  ],
  // Avoid applying class/private transforms to react-native-maps: they turn
  // declaration-only fields into instance props that shadow decorateMapComponent methods.
  overrides: [
    {
      test: filename =>
        !!filename &&
        !filename.includes(`${path.sep}node_modules${path.sep}react-native-maps${path.sep}`),
      plugins: [['@babel/plugin-transform-private-methods', { loose: true }]],
    },
  ],
};
