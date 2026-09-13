module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@shopify/flash-list|react-native-worklets|react-clone-referenced-element)',
  ],
  moduleNameMapper: {
    '^@shopify/flash-list$': '<rootDir>/__mocks__/flash-list.js',
    '^react-native-reanimated$': '<rootDir>/__mocks__/reanimated.js',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
  },
};
