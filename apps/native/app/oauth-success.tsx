import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * OAuth Success Screen
 *
 * This screen is shown after successful OAuth redirect from financial providers.
 * Deep link: nueink://oauth-success?provider=ynab
 *
 * Flow:
 * 1. User completes OAuth on provider site
 * 2. Provider redirects to AWS Lambda callback
 * 3. Lambda stores tokens and redirects here
 * 4. This screen shows success message
 * 5. Backend sync Lambda will run on schedule (or can be triggered manually)
 */
export default function OAuthSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ provider?: string }>();
  const [countdown, setCountdown] = useState(5);

  const providerName = params.provider?.toUpperCase() || 'Financial Account';

  useEffect(() => {
    // Countdown to auto-navigate
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/onboard'); // Return to main screen
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
        </View>

        {/* Success Message */}
        <Text variant="headlineMedium" style={styles.title}>
          {providerName} Connected!
        </Text>

        <Text variant="bodyLarge" style={styles.message}>
          Your account has been successfully connected.
        </Text>

        <Text variant="bodyMedium" style={styles.syncMessage}>
          Your financial data will sync automatically within the next few minutes.
        </Text>

        {/* Auto-redirect countdown */}
        <View style={styles.countdownContainer}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={styles.countdown}>
            Returning in {countdown} seconds...
          </Text>
        </View>

        {/* Manual navigation */}
        <Button
          mode="contained"
          onPress={() => router.replace('/onboard')}
          style={styles.button}
        >
          Continue
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginBottom: 12,
  },
  syncMessage: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  countdown: {
    opacity: 0.6,
  },
  button: {
    minWidth: 200,
  },
});
