import { defineFunction } from '@aws-amplify/backend';

export const nueInkApi = defineFunction({
  name: 'nueink-api',
  timeoutSeconds: 30,
});
