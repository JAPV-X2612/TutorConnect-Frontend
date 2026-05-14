import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#006A75" />
    </View>
  );
}
