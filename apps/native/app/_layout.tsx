import { Stack } from 'expo-router';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { SafeAreaView } from 'react-native';
import { Amplify } from 'aws-amplify';
import { Provider as PaperProvider, Surface } from 'react-native-paper';

import { NueInkDarkTheme } from '@nueink/ui';
import outputs from '../../../packages/aws/amplify_outputs.json';
import { parseAmplifyConfig } from 'aws-amplify/utils';
const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure(
  {
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: outputs.custom.API,
    },
  },
  {
    API: {
      REST: {
        retryStrategy: {
          strategy: 'no-retry', // Overrides default retry strategy
        },
      },
    },
  }
);

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
