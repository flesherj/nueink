import { View } from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackHeaderProps,
} from '@react-navigation/native-stack';
import { Text } from 'react-native-paper';
import { MainScreen } from './MainScreen';

const NueInkScreens = {
  MAIN: 'MAIN',
};

const ScreenStack = createNativeStackNavigator();

export const NueInkAppHeader = (_props: NativeStackHeaderProps) => {
  return (
    <View>
      <Text>Header</Text>
    </View>
  );
};
export const WebScreenStack = () => {
  return (
    <ScreenStack.Navigator screenOptions={{ header: NueInkAppHeader }}>
      <ScreenStack.Screen name={NueInkScreens.MAIN} component={MainScreen} />
    </ScreenStack.Navigator>
  );
};
