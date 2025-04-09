import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle, VISUAL_STYLES } from '../context/VisualStyleContext';
import { resetDatabase, generateMockData } from '../utils/database';

const MoodSettingsScreen = ({ onClose }) => {
  const { t, changeLanguage, currentLanguage } = useLanguage();
  const { visualStyle, changeVisualStyle } = useVisualStyle();
  const [isProcessing, setIsProcessing] = useState(false);
  const insets = useSafeAreaInsets();

  // Handle language change
  const handleLanguageChange = (language) => {
    changeLanguage(language);
  };

  // Handle visual style change
  const handleVisualStyleChange = (style) => {
    changeVisualStyle(style);
  };

  // Handle database reset
  const handleResetDatabase = () => {
    Alert.alert(
      t('resetDatabase'),
      t('resetConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('reset'), 
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await resetDatabase();
              Alert.alert(
                t('success'),
                t('databaseResetSuccess'),
                [{ text: t('ok') }]
              );
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert(
                t('error'),
                t('databaseResetError'),
                [{ text: t('ok') }]
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Render a section header
  const renderSectionHeader = (title) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  // Render language selection option
  const renderLanguageOption = (language, label) => (
    <TouchableOpacity 
      style={[
        styles.languageOption, 
        currentLanguage === language && styles.selectedLanguageOption
      ]}
      onPress={() => handleLanguageChange(language)}
      disabled={isProcessing}
    >
      <Text style={[
        styles.languageText,
        currentLanguage === language && styles.selectedLanguageText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render visual style selection option
  const renderVisualStyleOption = (style, label) => (
    <TouchableOpacity 
      style={[
        styles.visualStyleOption, 
        visualStyle === style && styles.selectedVisualStyleOption
      ]}
      onPress={() => handleVisualStyleChange(style)}
      disabled={isProcessing}
    >
      <Text style={[
        styles.visualStyleText,
        visualStyle === style && styles.selectedVisualStyleText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'white', paddingTop: 0 }]} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{t('settings')}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: Math.max(20, insets.bottom) }}
      >
        {/* Language section */}
        {renderSectionHeader(t('language'))}
        <View style={styles.optionGroup}>
          <View style={styles.languageOptions}>
            {renderLanguageOption('english', 'English')}
            {renderLanguageOption('german', 'Deutsch')}
          </View>
        </View>

        {/* Visual style section */}
        {renderSectionHeader(t('visualStyle'))}
        <View style={styles.optionGroup}>
          <View style={styles.visualStyleOptions}>
            {renderVisualStyleOption(VISUAL_STYLES.SMILEYS, t('smileys'))}
            {renderVisualStyleOption(VISUAL_STYLES.MINIMAL, t('minimal'))}
            {renderVisualStyleOption(VISUAL_STYLES.ICONS, t('icons'))}
            {renderVisualStyleOption(VISUAL_STYLES.SLIDER, t('slider'))}
          </View>
          <Text style={styles.visualStyleDescription}>
            {t('visualStyleDescription')}
          </Text>
        </View>

        {/* Database management section */}
        {renderSectionHeader(t('databaseManagement'))}
        <View style={styles.optionGroup}>
          <TouchableOpacity 
            style={[styles.buttonOption, styles.destructiveButton]}
            onPress={handleResetDatabase}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, styles.destructiveText]}>
              {t('resetDatabase')}
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FFD54F',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionGroup: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedLanguageOption: {
    backgroundColor: '#FFD54F',
  },
  languageText: {
    fontSize: 14,
  },
  selectedLanguageText: {
    fontWeight: 'bold',
  },
  visualStyleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  visualStyleOption: {
    width: '48%',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedVisualStyleOption: {
    backgroundColor: '#FFD54F',
  },
  visualStyleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedVisualStyleText: {
    fontWeight: 'bold',
  },
  visualStyleDescription: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textAlign: 'center',
  },
  buttonOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  destructiveButton: {
    // No special styling for the button background
  },
  destructiveText: {
    color: '#FF3B30',
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textAlign: 'center',
  },
});

export default MoodSettingsScreen; 