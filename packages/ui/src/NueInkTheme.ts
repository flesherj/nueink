import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import merge from 'deepmerge';
import deepmerge from 'deepmerge';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const Light = deepmerge(MD3LightTheme, {
  colors: {
    primary: 'rgb(102, 80, 164)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(232, 221, 255)',
    onPrimaryContainer: 'rgb(34, 0, 93)',
    secondary: 'rgb(0, 107, 95)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(115, 248, 228)',
    onSecondaryContainer: 'rgb(0, 32, 28)',
    tertiary: 'rgb(108, 78, 162)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(235, 220, 255)',
    onTertiaryContainer: 'rgb(38, 0, 88)',
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    background: 'rgb(255, 251, 255)',
    onBackground: 'rgb(28, 27, 30)',
    surface: 'rgb(255, 251, 255)',
    onSurface: 'rgb(28, 27, 30)',
    surfaceVariant: 'rgb(231, 224, 236)',
    onSurfaceVariant: 'rgb(73, 69, 78)',
    outline: 'rgb(122, 117, 127)',
    outlineVariant: 'rgb(202, 196, 207)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(49, 48, 51)',
    inverseOnSurface: 'rgb(244, 239, 244)',
    inversePrimary: 'rgb(207, 189, 255)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(247, 242, 250)',
      level2: 'rgb(243, 237, 248)',
      level3: 'rgb(238, 232, 245)',
      level4: 'rgb(237, 231, 244)',
      level5: 'rgb(234, 227, 242)',
    },
    surfaceDisabled: 'rgba(28, 27, 30, 0.12)',
    onSurfaceDisabled: 'rgba(28, 27, 30, 0.38)',
    backdrop: 'rgba(50, 47, 56, 0.4)',
  },
});

const Dark = deepmerge(MD3DarkTheme, {
  colors: {
    primary: 'rgb(207, 189, 255)',
    onPrimary: 'rgb(55, 30, 115)',
    primaryContainer: 'rgb(78, 55, 139)',
    onPrimaryContainer: 'rgb(232, 221, 255)',
    secondary: 'rgb(83, 219, 200)',
    onSecondary: 'rgb(0, 55, 49)',
    secondaryContainer: 'rgb(0, 80, 71)',
    onSecondaryContainer: 'rgb(115, 248, 228)',
    tertiary: 'rgb(212, 187, 255)',
    onTertiary: 'rgb(60, 29, 112)',
    tertiaryContainer: 'rgb(83, 54, 136)',
    onTertiaryContainer: 'rgb(235, 220, 255)',
    error: 'rgb(255, 180, 171)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(147, 0, 10)',
    onErrorContainer: 'rgb(255, 180, 171)',
    background: 'rgb(28, 27, 30)',
    onBackground: 'rgb(230, 225, 230)',
    surface: 'rgb(28, 27, 30)',
    onSurface: 'rgb(230, 225, 230)',
    surfaceVariant: 'rgb(73, 69, 78)',
    onSurfaceVariant: 'rgb(202, 196, 207)',
    outline: 'rgb(148, 143, 153)',
    outlineVariant: 'rgb(73, 69, 78)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(230, 225, 230)',
    inverseOnSurface: 'rgb(49, 48, 51)',
    inversePrimary: 'rgb(102, 80, 164)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(37, 35, 41)',
      level2: 'rgb(42, 40, 48)',
      level3: 'rgb(48, 45, 55)',
      level4: 'rgb(50, 46, 57)',
      level5: 'rgb(53, 50, 62)',
    },
    surfaceDisabled: 'rgba(230, 225, 230, 0.12)',
    onSurfaceDisabled: 'rgba(230, 225, 230, 0.38)',
    backdrop: 'rgba(50, 47, 56, 0.4)',
  },
});

export type NueInkTheme = typeof Light;
export const NueInkLightTheme = merge(LightTheme, Light);
export const NueInkDarkTheme = merge(DarkTheme, Dark);

/**
 * Converts NueInk Paper theme to Amplify UI theme format
 * This ensures consistent theming across Amplify Authenticator and the rest of the app
 */
export const createAmplifyTheme = (paperTheme: NueInkTheme) => {
  const { colors } = paperTheme;

  return {
    tokens: {
      colors: {
        background: {
          primary: colors.background,
          secondary: colors.elevation.level1,
          tertiary: colors.elevation.level2,
        },
        font: {
          primary: colors.onBackground,
          secondary: colors.onSurfaceVariant,
          tertiary: colors.outline,
          interactive: colors.primary,
        },
        border: {
          primary: colors.outlineVariant,
          secondary: colors.outline,
          tertiary: colors.onSurfaceVariant,
        },
        primary: {
          10: colors.onPrimaryContainer,
          20: colors.primaryContainer,
          40: colors.primary,
          60: colors.primary, // Material 3 doesn't have all shades, reusing
          80: colors.inversePrimary,
          90: colors.primaryContainer,
          100: colors.onPrimary,
        },
        secondary: {
          10: colors.onSecondaryContainer,
          20: colors.secondaryContainer,
          40: colors.secondary,
          60: colors.secondary,
          80: colors.secondary,
          90: colors.secondaryContainer,
          100: colors.onSecondary,
        },
      },
    },
  };
};

// Pre-created Amplify themes for convenience
export const NueInkAmplifyDarkTheme = createAmplifyTheme(NueInkDarkTheme);
export const NueInkAmplifyLightTheme = createAmplifyTheme(NueInkLightTheme);
