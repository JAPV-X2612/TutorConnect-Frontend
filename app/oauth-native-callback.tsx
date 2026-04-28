import { ActivityIndicator, View } from 'react-native';

/**
 * Clerk OAuth deep-link landing screen.
 *
 * This screen is the redirect target for all OAuth flows. It intentionally
 * does NOT navigate — navigation is fully handled by the hook that initiated
 * the OAuth flow (useTutorRegistration, useLearnerRegistration, etc.) once
 * startOAuthFlow() resolves.
 *
 * Previously this screen called router.replace('/'), which caused a race
 * condition: it navigated to index.tsx (and then to the role dashboard) before
 * startOAuthFlow() could return, bypassing tutor-detalles.tsx entirely.
 */
export default function OAuthNativeCallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#006A75" />
    </View>
  );
}
