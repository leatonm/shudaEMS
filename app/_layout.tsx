import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  IBMPlexMono_500Medium,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CadHeaderTitle } from '@/components/ui/BrandMark';
import { theme } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    IBMPlexMono: IBMPlexMono_500Medium,
    IBMPlexMonoBold: IBMPlexMono_700Bold,
    SpaceMono: IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.backgroundAlt,
          },
          headerShadowVisible: false,
          headerTintColor: theme.colors.emsBlue,
          headerTitleAlign: 'left',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="emt/difficulty"
          options={{
            headerBackTitle: 'Home',
            headerTitle: () => (
              <CadHeaderTitle title="DIFFICULTY" channel="SELECT" />
            ),
          }}
        />
        <Stack.Screen
          name="emt/dispatch/[id]"
          options={{
            headerBackTitle: 'Difficulty',
            headerTitle: () => (
              <CadHeaderTitle title="DISPATCH" channel="CAD" />
            ),
          }}
        />
        <Stack.Screen
          name="emt/call/[id]"
          options={{
            headerBackTitle: 'Difficulty',
            headerTitle: () => (
              <CadHeaderTitle title="ACTIVE CALL" channel="IN PROGRESS" />
            ),
          }}
        />
        <Stack.Screen
          name="emt/handoff"
          options={{
            headerBackVisible: false,
            headerTitle: () => (
              <CadHeaderTitle title="HANDOFF" channel="ED ARRIVAL" />
            ),
          }}
        />
        <Stack.Screen
          name="emt/settings"
          options={{
            headerBackTitle: 'Home',
            headerTitle: () => (
              <CadHeaderTitle title="SETTINGS" channel="TRAINING NET" />
            ),
          }}
        />
        <Stack.Screen
          name="emt/debrief"
          options={{
            headerBackVisible: false,
            headerTitle: () => (
              <CadHeaderTitle title="DEBRIEF" channel="CALL REVIEW" />
            ),
          }}
        />
        <Stack.Screen
          name="emt/leaderboard"
          options={{
            headerBackTitle: 'Home',
            headerTitle: () => (
              <CadHeaderTitle title="STANDINGS" channel="LEADERBOARD" />
            ),
          }}
        />
      </Stack>
    </>
  );
}
