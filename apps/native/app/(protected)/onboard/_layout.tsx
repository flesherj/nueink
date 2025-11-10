import { useAccountProvider } from '@nueink/ui';
import { Surface, Text, Button } from 'react-native-paper';
import { useEffect, useMemo } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

const OnboardRoot = () => {
  const { account } = useAccountProvider();
  const { signOut } = useAuthenticator();

  const loading = useMemo(() => account === undefined, [account]);

  useEffect(() => {
    if (account) console.log('account', account);
    if (!account) console.log('no account yet');
  }, [account]);

  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      {!loading && (
        <>
          <Text>Onboard: {account!.accountId}</Text>
          <Button mode="outlined" onPress={signOut} style={{ marginTop: 16 }}>
            Sign Out
          </Button>
        </>
      )}
      {loading && <Text>Loading...</Text>}
    </Surface>
  );
};

export default OnboardRoot;
