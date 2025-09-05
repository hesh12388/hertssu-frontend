import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/login';
const stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <stack.Navigator initialRouteName='Login' screenOptions={{ headerShown: false }}>
      <stack.Screen name="Login" component={Login} />
    </stack.Navigator>
  );
}

export default AuthNavigator;