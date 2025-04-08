import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
// Replace imported EMOTIONS with the one defined in MoodScreen
// import { EMOTIONS } from '../data/models';

// Use the same EMOTIONS definition as in MoodScreen.js
const EMOTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'bored', label: 'Bored', emoji: '😒' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'confused', label: 'Confused', emoji: '😕' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'content', label: 'Content', emoji: '🙂' },
];

const MoodHistory = ({ 
  entries, 
  onEntryPress, 
  onEndReached, 
  onRefresh, 
  refreshing,
  isLoadingMore,
  bottomInset = 0
}) => {
  const getEmotionDetails = (emotionValue) => {
    return EMOTIONS.find(e => e.value === emotionValue) || { label: 'Unknown', emoji: '❓' };
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No mood entries yet</Text>
      <Text style={styles.emptySubtext}>Your mood history will appear here</Text>
    </View>
  );

  const renderMoodEntry = ({ item }) => {
    const emotion = getEmotionDetails(item.emotion);
    
    return (
      <TouchableOpacity 
        style={styles.entryContainer}
        onPress={() => onEntryPress && onEntryPress(item)}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatDate(item.entry_time)}</Text>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
            <Text style={styles.ratingText}>{item.rating}/5</Text>
          </View>
        </View>
        
        <View style={styles.emotionContainer}>
          <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
          <Text style={styles.emotionLabel}>{emotion.label}</Text>
        </View>
        
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Render footer with loading indicator when loading more entries
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FFD54F" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  // Get color based on rating
  const getRatingColor = (rating) => {
    const colors = {
      1: '#E57373', // Red
      2: '#FFB74D', // Orange
      3: '#FFD54F', // Yellow
      4: '#81C784', // Light Green
      5: '#4CAF50', // Green
    };
    return colors[rating] || '#FFD54F';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood History</Text>
      <FlatList
        data={entries}
        renderItem={renderMoodEntry}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={entries.length === 0 ? { flex: 1 } : { paddingBottom: Math.max(20, bottomInset) }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFD54F']}
            tintColor="#FFD54F"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
    marginTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  entryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  emotionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default MoodHistory; 