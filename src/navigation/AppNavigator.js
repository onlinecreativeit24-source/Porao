import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ReferralScreen from '../screens/ReferralScreen';
import ChatScreen from '../screens/ChatScreen';
import VerifyIDScreen from '../screens/VerifyIDScreen';
import AdminVerifyScreen from '../screens/AdminVerifyScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'নতুন পোস্ট' }} />
            <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'রেফারেল' }} />
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={({ route }) => ({ title: route.params?.otherUserName || 'মেসেজ' })}
            />
            <Stack.Screen name="VerifyID" component={VerifyIDScreen} options={{ title: 'আইডি ভেরিফিকেশন' }} />
            <Stack.Screen name="AdminVerify" component={AdminVerifyScreen} options={{ title: 'পেন্ডিং ভেরিফিকেশন' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
