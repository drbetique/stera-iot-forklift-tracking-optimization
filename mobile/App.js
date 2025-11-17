import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import { COLORS } from './styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

/**
 * Auth Navigator - Handles login flow
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Home Stack Navigator - Contains main app screens
 */
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{
          title: 'Forklift Details',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * App Navigator - Main tab navigator for authenticated users
 */
function AppNavigator() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          borderTopWidth: 1,
          borderTopColor: COLORS.border.light,
          backgroundColor: COLORS.background.secondary,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Forklifts"
        component={HomeStack}
        options={{
          tabBarLabel: 'Fleet',
          tabBarIcon: ({ color, size = 24 }) => (
            <Text style={{ fontSize: size }}>🚜</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size = 24 }) => (
            <Text style={{ fontSize: size }}>🔔</Text>
          ),
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="UserManagement"
          component={UserManagementScreen}
          options={{
            tabBarLabel: 'Users',
            tabBarIcon: ({ color, size = 24 }) => (
              <Text style={{ fontSize: size }}>👥</Text>
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

/**
 * Loading Screen Component
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

/**
 * Root Navigator - Determines which navigator to show based on auth state
 */
function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a0aec0',
  },
});
