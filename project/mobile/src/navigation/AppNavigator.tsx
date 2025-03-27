import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ReportIssueScreen } from '../screens/ReportIssueScreen';
import { CommunityFeedScreen } from '../screens/CommunityFeedScreen';

const Stack = createStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CommunityFeed">
        <Stack.Screen 
          name="CommunityFeed" 
          component={CommunityFeedScreen}
          options={{ title: 'Community Feed' }}
        />
        <Stack.Screen 
          name="ReportIssue" 
          component={ReportIssueScreen}
          options={{ title: 'Report Issue' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
