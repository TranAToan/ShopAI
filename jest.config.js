module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@shopify/flash-list$': '<rootDir>/__mocks__/flash-list.js',
    '^react-native-reanimated$': '<rootDir>/__mocks__/reanimated.js',
  },
};
