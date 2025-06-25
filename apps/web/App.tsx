import {useEffect, useState} from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import {Button} from '@nueink/ui';
import {aws} from '@nueink/aws';

export default function App() {
    const [bla, setBla] = useState<string>('no-set');
    useEffect(() => {
        setBla(aws());
    }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!: {bla}</Text>
      <Button title="Button" onPress={() => {console.log('Button pressed')}} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
