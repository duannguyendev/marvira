import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { withScreenSafeArea } from '../components/Screen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const authEdges = ['top', 'bottom', 'left', 'right'] as const;
const LoginScreenSafe = withScreenSafeArea(LoginScreen, [...authEdges]);
const RegisterScreenSafe = withScreenSafeArea(RegisterScreen, [...authEdges]);
const ForgotPasswordScreenSafe = withScreenSafeArea(ForgotPasswordScreen, [
  ...authEdges,
]);
const ResetPasswordScreenSafe = withScreenSafeArea(ResetPasswordScreen, [
  ...authEdges,
]);

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen name="Login" component={LoginScreenSafe} />
      <Stack.Screen name="Register" component={RegisterScreenSafe} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreenSafe}
      />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreenSafe} />
    </Stack.Navigator>
  );
};
