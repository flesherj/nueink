import { Stack } from 'expo-router';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { SafeAreaView } from 'react-native';
import { Amplify } from 'aws-amplify';
import { Provider as PaperProvider, Surface } from 'react-native-paper';

import { NueInkDarkTheme } from '@nueink/ui';
import outputs from '../../../packages/aws/amplify_outputs.json';

Amplify.configure(outputs);

const RootLayout = () => {
  return (
    <PaperProvider theme={NueInkDarkTheme}>
      <Authenticator.Provider>
        <Authenticator>
          <Surface style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }} />
            </SafeAreaView>
          </Surface>
        </Authenticator>
      </Authenticator.Provider>
    </PaperProvider>
  );
};

export default RootLayout;
