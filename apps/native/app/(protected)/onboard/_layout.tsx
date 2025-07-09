import { useAccountProvider } from '@nueink/ui';
import { Surface, Text } from 'react-native-paper';

const OnboardRoot = () => {
  const { account } = useAccountProvider();
  const loading = account === undefined;

  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      {!loading && <Text>Onboard: {account.accountId}</Text>}
      {loading && <Text>Loading...</Text>}
    </Surface>
  );
};

export default OnboardRoot;
