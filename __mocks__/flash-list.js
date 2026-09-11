const React = require('react');
const { FlatList } = require('react-native');

exports.FlashList = React.forwardRef((props, ref) =>
  React.createElement(FlatList, { ...props, ref }),
);
