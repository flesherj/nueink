import { Authenticator } from '@aws-amplify/ui-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';

import { NueInkDarkTheme, NueInkLightTheme } from '@nueink/ui';

import { WebScreenStack } from './components/screens/ScreenStack';

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <Authenticator.Provider>
      <Authenticator>
        <PaperProvider
          theme={colorScheme === 'dark' ? NueInkDarkTheme : NueInkLightTheme}
        >
          <NavigationContainer
            theme={colorScheme === 'dark' ? NueInkDarkTheme : NueInkLightTheme}
          >
            <WebScreenStack />
          </NavigationContainer>
        </PaperProvider>
      </Authenticator>
    </Authenticator.Provider>
  );
}
