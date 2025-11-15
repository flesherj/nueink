import { Stack } from 'expo-router';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react-native';
import { SafeAreaView, useColorScheme } from 'react-native';
import { Provider as PaperProvider, Surface } from 'react-native-paper';

import {
  NueInkDarkTheme,
  NueInkLightTheme,
  NueInkAmplifyDarkTheme,
  NueInkAmplifyLightTheme,
} from '@nueink/ui';
import { NueInkAmplifyBuilder } from '@nueink/aws';

// Configure Amplify with REST API support
NueInkAmplifyBuilder.builder().withApiSupport().build();

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colorMode = colorScheme ?? 'dark'; // Default to dark if null

  return (
    <PaperProvider theme={isDark ? NueInkDarkTheme : NueInkLightTheme}>
      <ThemeProvider
        theme={isDark ? NueInkAmplifyDarkTheme : NueInkAmplifyLightTheme}
        colorMode={colorMode}
      >
        <Authenticator.Provider>
          <Authenticator key={colorMode}>
            <Surface style={{ flex: 1 }}>
              <SafeAreaView style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false }} />
              </SafeAreaView>
            </Surface>
          </Authenticator>
        </Authenticator.Provider>
      </ThemeProvider>
    </PaperProvider>
  );
};

export default RootLayout;
