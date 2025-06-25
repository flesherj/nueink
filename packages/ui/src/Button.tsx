import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button = ({ title, onPress }: ButtonProps) => (
  <PaperButton mode="contained-tonal" onPress={onPress} style={styles.button}>
    {title}
  </PaperButton>
);

const styles = StyleSheet.create({
  button: {
    margin: 10,
  },
});
