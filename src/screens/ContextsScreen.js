import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const ContextsScreen = () => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {t('contexts')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default ContextsScreen; 