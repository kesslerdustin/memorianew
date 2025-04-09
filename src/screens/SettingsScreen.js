import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, DeviceEventEmitter } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import { resetDatabase, generateMockData } from '../database/MoodsDB';
import { resetAllDatabases } from '../services/DatabaseService';

const SettingsScreen = ({ onClose }) => {
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

  // Handle resetting all databases
  const handleResetAllDatabases = () => {
    Alert.alert(
      t('resetAllDatabases') || 'Reset All Databases',
      t('resetAllDatabasesConfirmation') || 'This will delete ALL data from ALL databases. This action cannot be undone. Are you sure you want to continue?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('reset'), 
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await resetAllDatabases();
              
              // Emit an event to notify all screens to reload data
              DeviceEventEmitter.emit('DATABASE_RESET');
              
              Alert.alert(
                t('success'),
                t('allDatabasesResetSuccess') || 'All databases have been successfully reset.',
                [{ 
                  text: t('ok'),
                  onPress: () => {
                    // Delay closing settings screen to ensure database reset completes
                    setTimeout(() => {
                      if (onClose) onClose();
                    }, 1500);
                  }
                }]
              );
            } catch (error) {
              console.error('Error resetting all databases:', error);
              Alert.alert(
                t('error'),
                t('allDatabasesResetError') || 'There was an error resetting all databases.',
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

  // Handle generating mock data
  const handleGenerateMockData = () => {
    Alert.alert(
      t('generateMockData'),
      t('generateMockDataConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('generate'), 
          onPress: async () => {
            setIsProcessing(true);
            try {
              await generateMockData();
              Alert.alert(
                t('success'),
                t('mockDataGeneratedSuccess'),
                [{ text: t('ok') }]
              );
            } catch (error) {
              console.error('Error generating mock data:', error);
              Alert.alert(
                t('error'),
                t('mockDataGeneratedError'),
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

  // Render settings option with a switch
  const renderSwitchOption = (title, value, onValueChange, disabled = false) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionText}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isProcessing}
        trackColor={{ false: '#767577', true: '#FFD54F' }}
        thumbColor={value ? '#F5B400' : '#f4f3f4'}
      />
    </View>
  );

  // Render button option
  const renderButtonOption = (title, onPress, destructive = false) => (
    <TouchableOpacity 
      style={[styles.buttonOption, destructive && styles.destructiveButton]}
      onPress={onPress}
      disabled={isProcessing}
    >
      <Text style={[styles.buttonText, destructive && styles.destructiveText]}>
        {title}
      </Text>
    </TouchableOpacity>
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
            {renderLanguageOption('en', 'English')}
            {renderLanguageOption('es', 'Español')}
            {renderLanguageOption('fr', 'Français')}
            {renderLanguageOption('de', 'Deutsch')}
            {renderLanguageOption('ja', '日本語')}
          </View>
        </View>

        {/* Visual style section */}
        {renderSectionHeader(t('visualStyle'))}
        <View style={styles.optionGroup}>
          <View style={styles.visualStyleOptions}>
            {renderVisualStyleOption('emoji', t('emoji'))}
            {renderVisualStyleOption('minimal', t('minimal'))}
            {renderVisualStyleOption('colorful', t('colorful'))}
          </View>
        </View>

        {/* Notification section */}
        {renderSectionHeader(t('notifications'))}
        <View style={styles.optionGroup}>
          {renderSwitchOption(t('dailyReminder'), false, () => {})}
          {renderSwitchOption(t('weeklyInsights'), true, () => {})}
          {renderSwitchOption(t('surveyPrompts'), true, () => {})}
        </View>

        {/* Privacy section */}
        {renderSectionHeader(t('privacy'))}
        <View style={styles.optionGroup}>
          {renderSwitchOption(t('storeLocation'), true, () => {})}
          {renderSwitchOption(t('storeWeather'), true, () => {})}
          {renderSwitchOption(t('anonymousAnalytics'), false, () => {})}
        </View>

        {/* Data management section */}
        {renderSectionHeader(t('dataManagement'))}
        <View style={styles.optionGroup}>
          {renderButtonOption(t('exportData'), () => {})}
          {renderButtonOption(t('importData'), () => {})}
          {renderButtonOption(t('generateMockData'), handleGenerateMockData)}
          {renderButtonOption(t('resetDatabase'), handleResetDatabase, true)}
          {renderButtonOption(t('resetAllDatabases') || 'Reset All Databases', handleResetAllDatabases, true)}
        </View>

        {/* About section */}
        {renderSectionHeader(t('about'))}
        <View style={styles.optionGroup}>
          {renderButtonOption(t('privacyPolicy'), () => {})}
          {renderButtonOption(t('termsOfService'), () => {})}
          {renderButtonOption(t('contactUs'), () => {})}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Memoria v1.0.0</Text>
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
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
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
    padding: 12,
  },
  visualStyleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedVisualStyleOption: {
    backgroundColor: '#FFD54F',
  },
  visualStyleText: {
    fontSize: 14,
  },
  selectedVisualStyleText: {
    fontWeight: 'bold',
  },
  versionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#888',
  },
});

export default SettingsScreen; 