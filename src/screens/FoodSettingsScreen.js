import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const FoodSettingsScreen = ({ onClose, topInset, bottomInset }) => {
  const { t } = useLanguage();
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [showNutritionGoals, setShowNutritionGoals] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const insets = useSafeAreaInsets();
  
  // Use the passed insets or fall back to hooks
  const safeTopInset = topInset !== undefined ? topInset : insets.top;
  const safeBottomInset = bottomInset !== undefined ? bottomInset : insets.bottom;

  // Mock function to export data
  const handleExportData = (format) => {
    Alert.alert(
      t('exportData') || 'Export Data',
      `${t('dataWillBeExportedAs') || 'Your food tracking data will be exported as'} ${format.toUpperCase()}`,
      [
        { text: t('ok') || 'OK' }
      ]
    );
  };

  // Mock function to import data
  const handleImportData = () => {
    Alert.alert(
      t('importData') || 'Import Data',
      t('importDataConfirmation') || 'This will add imported food entries to your database. Continue?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { text: t('import') || 'Import', onPress: () => console.log('Import data') }
      ]
    );
  };

  // Mock function to clear all data
  const handleClearData = () => {
    Alert.alert(
      t('clearAllData') || 'Clear All Data',
      t('clearDataConfirmation') || 'This will permanently delete all your food tracking data. This cannot be undone!',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('clearData') || 'Clear Data', 
          style: 'destructive',
          onPress: () => {
            // Implementation would go here
            Alert.alert(
              t('dataCleared') || 'Data Cleared',
              t('allDataCleared') || 'All food tracking data has been deleted.',
              [{ text: t('ok') || 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'white', paddingTop: 0 }]} edges={['left', 'right']}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: safeTopInset }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('foodSettings') || 'Food Settings'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Math.max(20, safeBottomInset) }}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('nutritionGoals') || 'Nutrition Goals'}</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('dailyCalorieGoal') || 'Daily Calorie Goal'}</Text>
              <TextInput
                style={styles.input}
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('nutritionTracking') || 'Advanced Nutrition Tracking'}</Text>
              <Switch
                value={showNutritionGoals}
                onValueChange={setShowNutritionGoals}
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={showNutritionGoals ? '#E8F5E9' : '#f4f3f4'}
              />
            </View>
            
            {showNutritionGoals && (
              <View style={styles.advancedSettings}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('proteinGoal') || 'Protein Goal (g)'}</Text>
                  <TextInput
                    style={styles.input}
                    value="50"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('carbsGoal') || 'Carbs Goal (g)'}</Text>
                  <TextInput
                    style={styles.input}
                    value="250"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('fatGoal') || 'Fat Goal (g)'}</Text>
                  <TextInput
                    style={styles.input}
                    value="70"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('reminders') || 'Reminders'}</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('mealReminders') || 'Meal Reminders'}</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={reminderEnabled ? '#E8F5E9' : '#f4f3f4'}
              />
            </View>
            
            {reminderEnabled && (
              <Text style={styles.reminderHint}>
                {t('reminderHint') || 'Reminder settings will be implemented in a future update.'}
              </Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dataManagement') || 'Data Management'}</Text>
            
            <View style={styles.exportOptions}>
              <Text style={styles.settingLabel}>{t('exportFormat') || 'Export Format'}</Text>
              <View style={styles.exportButtons}>
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    exportFormat === 'csv' && styles.selectedExportButton
                  ]}
                  onPress={() => setExportFormat('csv')}
                >
                  <Text style={styles.exportButtonText}>CSV</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    exportFormat === 'json' && styles.selectedExportButton
                  ]}
                  onPress={() => setExportFormat('json')}
                >
                  <Text style={styles.exportButtonText}>JSON</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExportData(exportFormat)}
            >
              <Text style={styles.actionButtonText}>{t('exportData') || 'Export Data'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleImportData}
            >
              <Text style={styles.actionButtonText}>{t('importData') || 'Import Data'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleClearData}
            >
              <Text style={styles.dangerButtonText}>{t('clearData') || 'Clear All Data'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about') || 'About'}</Text>
            <Text style={styles.aboutText}>
              {t('foodTrackerVersion') || 'Food Tracker Version: 1.0.0'}
            </Text>
            <Text style={styles.aboutText}>
              {t('foodTrackerDescription') || 'This food tracker helps you keep track of your daily nutrition intake and meal habits.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  advancedSettings: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reminderHint: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  exportOptions: {
    marginBottom: 16,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    width: 70,
    alignItems: 'center',
  },
  selectedExportButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  exportButtonText: {
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#f44336',
    marginTop: 16,
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default FoodSettingsScreen; 