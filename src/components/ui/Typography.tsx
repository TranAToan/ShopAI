import React, { memo } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';

type TypographyProps = {
  children: React.ReactNode;
  variant?: keyof typeof FONTS;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

function Typography({
  children,
  variant = 'body1',
  color = COLORS.text,
  style,
  numberOfLines,
}: TypographyProps): React.JSX.Element {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[FONTS[variant], { color }, style]}
    >
      {children}
    </Text>
  );
}

export default memo(Typography);
