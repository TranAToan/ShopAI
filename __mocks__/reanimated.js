const { View } = require('react-native');

module.exports = {
  __esModule: true,
  default: { View },
  useSharedValue: value => ({ value }),
  useAnimatedStyle: callback => callback(),
  withTiming: value => value,
};
