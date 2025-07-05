import { registerRootComponent } from 'expo';

import { NueInkAmplifyBuilder } from '@nueink/aws';

import App from './App';

NueInkAmplifyBuilder.builder().withApiSupport().build();

registerRootComponent(App);
