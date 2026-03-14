import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';

try {
  const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
  if (resolveAssetSource && typeof resolveAssetSource.setCustomSourceTransformer !== 'function') {
    resolveAssetSource.setCustomSourceTransformer = () => {};
  }
} catch (_e) {}

let hasSetDefaultFont = false;

export default function App() {
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#28CA99',
      });
    }
  }, []);
  if (!hasSetDefaultFont) {
    const textDefaults = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = {
      ...textDefaults,
      style: [{ fontFamily: 'Circular Std Medium' }, textDefaults.style],
    };
    const inputDefaults = (TextInput as any).defaultProps ?? {};
    (TextInput as any).defaultProps = {
      ...inputDefaults,
      style: [{ fontFamily: 'Circular Std Medium' }, inputDefaults.style],
    };
    hasSetDefaultFont = true;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
