import { Stack } from 'expo-router';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { SafeAreaView } from 'react-native';
import { Provider as PaperProvider, Surface } from 'react-native-paper';

import { NueInkDarkTheme } from '@nueink/ui';
import { NueInkAmplifyBuilder } from '@nueink/aws';

NueInkAmplifyBuilder.builder().withApiSupport().build();

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
