import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { resetDatabase } from '../utils/database';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle, VISUAL_STYLES } from '../context/VisualStyleContext';

const SettingsScreen = ({ navigation, onClose }) => {
  const { language, changeLanguage, t } = useLanguage();
  const { visualStyle, changeVisualStyle } = useVisualStyle();
  const insets = useSafeAreaInsets();

  // Handle database reset confirmation and action
  const handleResetDatabase = async () => {
    Alert.alert(
      t('resetDatabase'), 
      t('resetConfirmation'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('reset'), 
          style: "destructive",
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert(t('success'), t('resetSuccess'));
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert(t('error'), t('resetError'));
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={[styles.screenHeader, { paddingTop: Math.max(insets.top, 44) }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{t('settings')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(20, insets.bottom) }}
      >
        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                language === 'english' && styles.selectedOptionButton
              ]}
              onPress={() => changeLanguage('english')}
            >
              <Text style={[
                styles.optionText,
                language === 'english' && styles.selectedOptionText
              ]}>English</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                language === 'german' && styles.selectedOptionButton
              ]}
              onPress={() => changeLanguage('german')}
            >
              <Text style={[
                styles.optionText,
                language === 'german' && styles.selectedOptionText
              ]}>Deutsch</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Visual Style Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('visualStyle')}</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                visualStyle === VISUAL_STYLES.SMILEYS && styles.selectedOptionButton
              ]}
              onPress={() => changeVisualStyle(VISUAL_STYLES.SMILEYS)}
            >
              <Text style={styles.optionText}>{t('smileys')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                visualStyle === VISUAL_STYLES.MINIMAL && styles.selectedOptionButton
              ]}
              onPress={() => changeVisualStyle(VISUAL_STYLES.MINIMAL)}
            >
              <Text style={styles.optionText}>{t('minimal')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                visualStyle === VISUAL_STYLES.ICONS && styles.selectedOptionButton
              ]}
              onPress={() => changeVisualStyle(VISUAL_STYLES.ICONS)}
            >
              <Text style={styles.optionText}>{t('icons')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                visualStyle === VISUAL_STYLES.SLIDER && styles.selectedOptionButton
              ]}
              onPress={() => changeVisualStyle(VISUAL_STYLES.SLIDER)}
            >
              <Text style={styles.optionText}>{t('slider')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Database Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('databaseManagement')}</Text>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetDatabase}
          >
            <Text style={styles.dangerButtonText}>{t('resetDatabase')}</Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>{t('resetWarning')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFD54F',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#FFD54F',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#333',
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  warningText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default SettingsScreen; 