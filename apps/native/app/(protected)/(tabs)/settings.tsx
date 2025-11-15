import { View, StyleSheet } from 'react-native';
import { Surface, Text, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAccountProvider } from '@nueink/ui';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { account } = useAccountProvider();
  const { signOut } = useAuthenticator();

  return (
    <Surface style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account
        </Text>
        <List.Item
          title={account?.email || 'Not loaded'}
          description={account?.username || 'Loading...'}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
      </View>

      <Divider />

      {/* Integrations Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Integrations
        </Text>
        <List.Item
          title="Connect Accounts"
          description="Connect YNAB, Plaid, and other providers"
          left={(props) => <List.Icon {...props} icon="link-variant" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/connect-accounts')}
        />
      </View>

      <Divider />

      {/* Organization Section */}
      {account?.defaultOrgId && (
        <>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Organization
            </Text>
            <List.Item
              title="Current Organization"
              description={account.defaultOrgId}
              left={(props) => <List.Icon {...props} icon="domain" />}
            />
          </View>
          <Divider />
        </>
      )}

      {/* App Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          App
        </Text>
        <List.Item
          title="About"
          description="Version 0.1.0 (MVP)"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Navigate to privacy policy
            console.log('Privacy policy');
          }}
        />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            // TODO: Navigate to terms
            console.log('Terms of service');
          }}
        />
      </View>

      <Divider />

      {/* Sign Out */}
      <View style={styles.section}>
        <List.Item
          title="Sign Out"
          titleStyle={styles.signOutText}
          left={(props) => <List.Icon {...props} icon="logout" color="#d32f2f" />}
          onPress={() => {
            signOut();
          }}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingVertical: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.6,
  },
  signOutText: {
    color: '#d32f2f',
  },
});
