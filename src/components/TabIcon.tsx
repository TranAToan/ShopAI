import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  name: 'HomeTab' | 'Cart' | 'Orders' | 'Profile';
  color: string;
  size: number;
};

// Draw icons with native views so they do not depend on an installed icon font.
export default function TabIcon({
  name,
  color,
  size,
}: Props): React.JSX.Element {
  const outline = { borderColor: color, borderWidth: 1.8 };
  const line = { backgroundColor: color };

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={[styles.canvas, { transform: [{ scale: size / 24 }] }]}>
        {name === 'HomeTab' && (
          <>
            <View style={[styles.house, outline]} />
            <View style={[styles.roof, { borderColor: color }]} />
            <View style={[styles.door, outline]} />
          </>
        )}
        {name === 'Cart' && (
          <>
            <View style={[styles.handle, line]} />
            <View style={[styles.basket, outline]} />
            <View style={[styles.axle, line]} />
            <View style={[styles.wheel, { left: 7 }, line]} />
            <View style={[styles.wheel, { left: 18 }, line]} />
          </>
        )}
        {name === 'Orders' && (
          <>
            <View style={[styles.document, outline]} />
            <View style={[styles.documentLine, { top: 8 }, line]} />
            <View style={[styles.documentLine, { top: 12 }, line]} />
            <View style={[styles.documentLine, { top: 16, width: 5 }, line]} />
          </>
        )}
        {name === 'Profile' && (
          <>
            <View style={[styles.head, outline]} />
            <View style={[styles.shoulders, outline]} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: 24, height: 24 },
  house: {
    position: 'absolute',
    left: 5,
    top: 10,
    width: 14,
    height: 12,
    borderTopWidth: 0,
    borderRadius: 2,
  },
  roof: {
    position: 'absolute',
    left: 5,
    top: 4,
    width: 14,
    height: 14,
    borderLeftWidth: 1.8,
    borderTopWidth: 1.8,
    transform: [{ rotate: '45deg' }],
    borderTopLeftRadius: 2,
  },
  door: {
    position: 'absolute',
    left: 10,
    top: 15,
    width: 5,
    height: 7,
    borderBottomWidth: 0,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  handle: {
    position: 'absolute',
    left: 1,
    top: 3,
    width: 5,
    height: 1.8,
    borderRadius: 1,
  },
  basket: {
    position: 'absolute',
    left: 5,
    top: 6,
    width: 17,
    height: 10,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    transform: [{ skewX: '-10deg' }],
  },
  axle: {
    position: 'absolute',
    left: 6,
    top: 17,
    width: 15,
    height: 1.8,
    borderRadius: 1,
  },
  wheel: {
    position: 'absolute',
    top: 20,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  document: {
    position: 'absolute',
    left: 4,
    top: 2,
    width: 16,
    height: 21,
    borderRadius: 3,
  },
  documentLine: {
    position: 'absolute',
    left: 8,
    width: 8,
    height: 1.8,
    borderRadius: 1,
  },
  head: {
    position: 'absolute',
    left: 8,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shoulders: {
    position: 'absolute',
    left: 4,
    top: 13,
    width: 16,
    height: 9,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
