import { get } from 'aws-amplify/api';

export class AccountApi {
  public getItems = async () => {
    try {
      const restOperation = get({
        apiName: 'nueInkRestApi',
        path: '/items',
      });
      const response = await restOperation.response;
      console.log('GET call succeeded: ', response);
    } catch (ex) {
      console.error('GET call failed: ', ex);
    }
  };
}
