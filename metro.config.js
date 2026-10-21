const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const rnConfig = require('@react-native/metro-config').getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  maxWorkers: 2,
  transformer: {
    // Expo SDK 57 uses the older registry path; retain RN 0.87's actual export.
    assetRegistryPath: rnConfig.transformer.assetRegistryPath,
  },
  serializer: {
    getPolyfills: rnConfig.serializer.getPolyfills,
    getModulesRunBeforeMainModule: rnConfig.serializer.getModulesRunBeforeMainModule,
  },
  resolver: {
    // npm nests Expo core due to its optional worklets peer range. Resolve the
    // single SDK-matched copy without downgrading the existing Reanimated stack.
    extraNodeModules: {
      'expo-modules-core': require('path').dirname(
        require.resolve('expo-modules-core/package.json', {
          paths: [require.resolve('expo/package.json')],
        }),
      ),
    },
    blockList: [
      /[/\\]shopai-backend[/\\]/,
      /[/\\]secrets[/\\]/,
      /[/\\]artifacts[/\\]/,
      /[/\\]ShopAI1App[/\\]/,
      /[/\\]react-native-thuc-chien-main[/\\]/,
      /[/\\]\.shopai-backups[/\\]/,
      /[/\\]\.cxx[/\\]/,
      /[/\\]\.npm-cache[/\\]/,
      /[/\\]\.npm-global[/\\]/,
      /[/\\]android[/\\](?:build|\.gradle)[/\\]/,
      /[/\\]android[/\\]app[/\\]build[/\\]/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
