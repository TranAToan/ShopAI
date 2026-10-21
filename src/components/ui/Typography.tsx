import React, { memo } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { FONTS } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

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
  color,
  style,
  numberOfLines,
}: TypographyProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[FONTS[variant], { color: color ?? colors.text }, style]}
    >
      {children}
    </Text>
  );
}

export default memo(Typography);
