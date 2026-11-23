module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-worklets|react-native-reanimated|react-native-css-interop|react-native-linear-gradient)/)',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/styleMock.js',
  },
};
