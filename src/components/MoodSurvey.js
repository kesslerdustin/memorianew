import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addMoodEntry } from '../utils/database';

const MoodSurvey = ({ isVisible, onClose }) => {
  // Survey questions for different aspects of wellbeing
  const QUESTIONS = [
    {
      id: 'overall',
      question: 'How would you rate your overall mood today?',
      type: 'rating',
      min: 1,
      max: 10,
      minLabel: 'Very Poor',
      maxLabel: 'Excellent'
    },
    {
      id: 'energy',
      question: 'How is your energy level?',
      type: 'rating',
      min: 1,
      max: 10,
      minLabel: 'Exhausted',
      maxLabel: 'Energetic'
    },
    {
      id: 'stress',
      question: 'How stressed do you feel?',
      type: 'rating',
      min: 1,
      max: 10,
      minLabel: 'Not stressed',
      maxLabel: 'Extremely stressed'
    },
    {
      id: 'sleep',
      question: 'How well did you sleep last night?',
      type: 'rating',
      min: 1,
      max: 10,
      minLabel: 'Poorly',
      maxLabel: 'Very well'
    },
    {
      id: 'social',
      question: 'How satisfied are you with your social interactions today?',
      type: 'rating',
      min: 1,
      max: 10,
      minLabel: 'Not satisfied',
      maxLabel: 'Very satisfied'
    },
    {
      id: 'highlight',
      question: 'What was the highlight of your day?',
      type: 'text'
    },
    {
      id: 'challenge',
      question: 'What was challenging today?',
      type: 'text'
    }
  ];

  // State to track answers
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Set a rating answer
  const setRatingAnswer = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  // Set a text answer
  const setTextAnswer = (questionId, text) => {
    setAnswers({
      ...answers,
      [questionId]: text
    });
  };

  // Move to the next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Move to the previous question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if the current question has been answered
  const isCurrentQuestionAnswered = () => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    return answers[currentQuestion.id] !== undefined && 
           (currentQuestion.type !== 'text' || answers[currentQuestion.id].trim() !== '');
  };

  // Handle survey submission
  const handleSubmit = async () => {
    // Check if all required questions are answered
    const unansweredQuestions = QUESTIONS.filter(q => 
      answers[q.id] === undefined || 
      (q.type === 'text' && answers[q.id].trim() === '')
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Incomplete Survey',
        'Please answer all questions before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      // Convert survey answers to a mood entry
      const moodEntry = {
        date: new Date().toISOString(),
        surveyData: answers,
        // Use overall mood as the main rating
        rating: answers.overall,
        // Derive emotion from energy and stress levels
        emotion: deriveEmotionFromAnswers(answers),
        notes: `Highlight: ${answers.highlight || 'None'}\nChallenge: ${answers.challenge || 'None'}`,
        tags: ['survey'],
        isSurvey: true
      };

      await addMoodEntry(moodEntry);
      Alert.alert(
        'Survey Complete',
        'Thank you for completing your mood check-in!',
        [{ text: 'Close', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error saving survey:', error);
      Alert.alert(
        'Error',
        'Failed to save your survey responses. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Reset survey when closed
  const handleClose = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    onClose();
  };

  // Derive emotion from answers (simplified algorithm)
  const deriveEmotionFromAnswers = (answers) => {
    const energy = answers.energy || 5;
    const stress = answers.stress || 5;
    const overall = answers.overall || 5;
    
    // Simple emotion mapping based on energy and stress
    if (overall >= 8) return 'happy';
    if (overall <= 3) return 'sad';
    if (energy <= 3 && stress <= 5) return 'tired';
    if (energy <= 4 && stress >= 7) return 'anxious';
    if (energy >= 7 && stress <= 4) return 'excited';
    if (energy >= 6 && stress >= 7) return 'angry';
    if (energy >= 5 && stress <= 4) return 'calm';
    
    return 'content'; // default emotion
  };

  // Render a rating question
  const renderRatingQuestion = (question) => {
    const ratings = Array.from({ length: question.max - question.min + 1 }, (_, i) => i + question.min);
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabel}>{question.minLabel}</Text>
          <Text style={styles.ratingLabel}>{question.maxLabel}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          {ratings.map(rating => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                answers[question.id] === rating && styles.selectedRating,
                { backgroundColor: getColorForRating(rating, question.id) }
              ]}
              onPress={() => setRatingAnswer(question.id, rating)}
            >
              <Text style={styles.ratingText}>{rating}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render a text question
  const renderTextQuestion = (question) => {
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Type your answer here..."
          value={answers[question.id] || ''}
          onChangeText={(text) => setTextAnswer(question.id, text)}
        />
      </View>
    );
  };

  // Get appropriate color for rating based on question type
  const getColorForRating = (rating, questionId) => {
    // For stress question, invert the color scale (high stress = red)
    if (questionId === 'stress') {
      if (rating >= 8) return '#d32f2f'; // High stress - red
      if (rating >= 6) return '#f57c00'; // Moderate stress - orange
      if (rating >= 4) return '#fdd835'; // Some stress - yellow
      return '#388e3c'; // Low stress - green
    }
    
    // For other questions
    if (rating <= 2) return '#d32f2f'; // Very negative - red
    if (rating <= 4) return '#f57c00'; // Negative - orange
    if (rating <= 6) return '#fdd835'; // Neutral - yellow
    if (rating <= 8) return '#7cb342'; // Positive - light green
    return '#388e3c'; // Very positive - green
  };

  // Current question
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mood Check-in</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#555" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }
            ]} 
          />
        </View>
        
        <ScrollView style={styles.scrollContainer}>
          {currentQuestion.type === 'rating' ? 
            renderRatingQuestion(currentQuestion) : 
            renderTextQuestion(currentQuestion)}
        </ScrollView>
        
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]} 
            onPress={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          {currentQuestionIndex < QUESTIONS.length - 1 ? (
            <TouchableOpacity 
              style={[styles.navButton, !isCurrentQuestionAnswered() && styles.disabledButton]} 
              onPress={goToNextQuestion}
              disabled={!isCurrentQuestionAnswered()}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#007AFF',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#555',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedRating: {
    borderWidth: 2,
    borderColor: '#000',
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default MoodSurvey; 