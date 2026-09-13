import React, { memo } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Typography from './Typography';
import { COLORS, SIZES } from '@constants/theme';

type ShopInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

function ShopInput({
  label,
  error,
  containerStyle,
  style,
  ...rest
}: ShopInputProps): React.JSX.Element {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Typography variant="body2" style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <TextInput
        placeholderTextColor={COLORS.textLight}
        selectionColor={COLORS.primary}
        autoCorrect={false}
        autoCapitalize={rest.autoCapitalize ?? 'sentences'}
        style={[
          styles.input,
          error ? styles.inputError : null,
          style as StyleProp<TextStyle>,
        ]}
        {...rest}
      />
      {error ? (
        <Typography variant="small" color={COLORS.error} style={styles.error}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.padding },
  label: { marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.error },
  error: { marginTop: 4 },
});

export default memo(ShopInput);
