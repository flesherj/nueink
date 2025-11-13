import { useAccountProvider } from '@nueink/ui';
import { Surface, Text, Button } from 'react-native-paper';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useRouter } from 'expo-router';

const OnboardRoot = () => {
  const { account } = useAccountProvider();
  const { signOut } = useAuthenticator();
  const router = useRouter();

  const loading = account === undefined;

  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      {!loading && (
        <>
          <Text>Onboard: {account!.accountId}</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/settings/connect-accounts')}
            style={{ marginTop: 16 }}
          >
            Connect Financial Accounts
          </Button>
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
