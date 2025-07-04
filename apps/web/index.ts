import { registerRootComponent } from 'expo';

import App from './App';
import { Amplify } from 'aws-amplify';
import outputs from '../../packages/aws/amplify_outputs.json';

Amplify.configure(outputs);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
