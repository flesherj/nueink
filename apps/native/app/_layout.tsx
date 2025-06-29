import { Stack } from 'expo-router';
import { Authenticator } from '@aws-amplify/ui-react-native';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  Surface,
} from 'react-native-paper';

import outputs from '../../../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { SafeAreaView } from 'react-native';

Amplify.configure(outputs);

const RootLayout = () => {
  return (
    <PaperProvider theme={MD3DarkTheme}>
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
