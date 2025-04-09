import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ProgressBarAndroid } from 'react-native';
import { saveMoodEntry, generateId } from '../database/database';

/**
 * ScientificSurvey component for validated psychological scales
 * Implements the "Periodic Scientifically Validated Surveys" section from mood.txt
 */
const ScientificSurvey = ({ surveyType = 'WHO5', onComplete, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Survey definitions
  const surveys = {
    // WHO-5 Well-being Index
    WHO5: {
      title: 'WHO-5 Well-being Index',
      description: 'Over the last two weeks, how often have you felt the following?',
      scale: [
        { value: 0, label: 'At no time' },
        { value: 1, label: 'Some of the time' },
        { value: 2, label: 'Less than half of the time' },
        { value: 3, label: 'More than half of the time' },
        { value: 4, label: 'Most of the time' },
        { value: 5, label: 'All of the time' }
      ],
      questions: [
        'I have felt cheerful and in good spirits',
        'I have felt calm and relaxed',
        'I have felt active and vigorous',
        'I woke up feeling fresh and rested',
        'My daily life has been filled with things that interest me'
      ],
      interpret: (score) => {
        const percentage = (score / 25) * 100;
        if (percentage <= 28) return 'Your well-being is low. Consider seeking support.';
        if (percentage <= 50) return 'Your well-being is below average.';
        if (percentage <= 72) return 'Your well-being is moderate.';
        return 'Your well-being is good.';
      }
    },
    
    // Short PANAS (Positive and Negative Affect Schedule)
    PANAS: {
      title: 'Short PANAS',
      description: 'Please indicate to what extent you have felt this way over the past week:',
      scale: [
        { value: 1, label: 'Very slightly / Not at all' },
        { value: 2, label: 'A little' },
        { value: 3, label: 'Moderately' },
        { value: 4, label: 'Quite a bit' },
        { value: 5, label: 'Extremely' }
      ],
      questions: [
        { text: 'Interested', type: 'positive' },
        { text: 'Distressed', type: 'negative' },
        { text: 'Excited', type: 'positive' },
        { text: 'Upset', type: 'negative' },
        { text: 'Strong', type: 'positive' },
        { text: 'Guilty', type: 'negative' },
        { text: 'Enthusiastic', type: 'positive' },
        { text: 'Hostile', type: 'negative' },
        { text: 'Proud', type: 'positive' },
        { text: 'Irritable', type: 'negative' }
      ],
      interpret: (scores) => {
        const positive = scores.positive / 5; // Average positive score (1-5)
        const negative = scores.negative / 5; // Average negative score (1-5)
        
        if (positive > 3.5 && negative < 2) return 'You are experiencing high positive affect and low negative affect.';
        if (positive < 2 && negative > 3.5) return 'You are experiencing low positive affect and high negative affect.';
        if (positive > 3.5 && negative > 3.5) return 'You are experiencing both high positive and negative affect.';
        if (positive < 2 && negative < 2) return 'You are experiencing both low positive and negative affect.';
        return 'You are experiencing moderate levels of both positive and negative affect.';
      }
    },
    
    // PHQ-9 (Depression scale)
    PHQ9: {
      title: 'PHQ-9 Depression Scale',
      description: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
      scale: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ],
      questions: [
        'Little interest or pleasure in doing things',
        'Feeling down, depressed, or hopeless',
        'Trouble falling or staying asleep, or sleeping too much',
        'Feeling tired or having little energy',
        'Poor appetite or overeating',
        'Feeling bad about yourself - or that you are a failure',
        'Trouble concentrating on things',
        'Moving or speaking so slowly that other people could have noticed',
        'Thoughts that you would be better off dead or of hurting yourself'
      ],
      interpret: (score) => {
        if (score <= 4) return 'Your symptoms suggest minimal depression.';
        if (score <= 9) return 'Your symptoms suggest mild depression.';
        if (score <= 14) return 'Your symptoms suggest moderate depression.';
        if (score <= 19) return 'Your symptoms suggest moderately severe depression.';
        return 'Your symptoms suggest severe depression. Please consider speaking with a healthcare professional.';
      }
    }
  };
  
  // Get current survey data
  const currentSurvey = surveys[surveyType];
  const totalQuestions = Array.isArray(currentSurvey.questions) 
    ? currentSurvey.questions.length 
    : 0;
  
  // Calculate progress
  const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) : 0;
  
  // Get current question
  const getCurrentQuestion = () => {
    if (!currentSurvey || !currentSurvey.questions || currentQuestionIndex >= totalQuestions) {
      return null;
    }
    return currentSurvey.questions[currentQuestionIndex];
  };
  
  // Handle answer selection
  const handleAnswer = (value) => {
    const newAnswers = { ...answers };
    const question = getCurrentQuestion();
    
    if (surveyType === 'PANAS') {
      // For PANAS, track by question type
      const questionType = question.type;
      if (!newAnswers[questionType]) {
        newAnswers[questionType] = 0;
      }
      newAnswers[questionType] += value;
    } else {
      // For other surveys, just add to total score
      if (!newAnswers.score) {
        newAnswers.score = 0;
      }
      newAnswers.score += value;
    }
    
    setAnswers(newAnswers);
    
    // Move to next question or finish survey
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleComplete(newAnswers);
    }
  };
  
  // Handle survey completion
  const handleComplete = async (finalAnswers) => {
    setIsSubmitting(true);
    
    try {
      // Create a standardized result based on survey type
      let result = {};
      let interpretation = '';
      
      if (surveyType === 'PANAS') {
        result = {
          positive: finalAnswers.positive || 0,
          negative: finalAnswers.negative || 0
        };
        interpretation = currentSurvey.interpret(result);
      } else {
        result = { score: finalAnswers.score || 0 };
        interpretation = currentSurvey.interpret(result.score);
      }
      
      // Create a direct timestamp string - bypass any potential conversion issues
      const timestamp = new Date().toISOString();
      const currentTime = Date.now();
      
      console.log("Using direct timestamp:", timestamp);
      
      // Save as a special mood entry
      const surveyEntry = {
        id: generateId(),
        timestamp, // Use the timestamp string directly
        entry_time: currentTime,
        rating: calculateMoodRating(surveyType, finalAnswers),
        emotion: 'survey', // Mark as a survey entry
        notes: `${currentSurvey.title} results: ${interpretation}`,
        tags: ['survey', surveyType],
        activities: {},
        surveyResults: {
          type: surveyType,
          result,
          interpretation
        }
      };
      
      console.log("About to save survey with data:", {
        id: surveyEntry.id,
        timestamp: surveyEntry.timestamp,
        entry_time: surveyEntry.entry_time,
        rating: surveyEntry.rating,
        emotion: surveyEntry.emotion
      });
      
      // Ensure the entry is saved before trying to access its ID for tags
      const savedEntry = await saveMoodEntry(surveyEntry);
      
      onComplete && onComplete({
        type: surveyType,
        result,
        interpretation
      });
    } catch (error) {
      console.error('Error saving survey results:', error);
      console.error('Error details:', error.message, error.stack);
      console.error('Survey data:', {
        type: surveyType,
        rating: calculateMoodRating(surveyType, finalAnswers),
        answers: finalAnswers
      });
      alert('Failed to save survey results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate a mood rating (1-5) from survey results
  const calculateMoodRating = (type, results) => {
    switch (type) {
      case 'WHO5':
        // Convert 0-25 scale to 1-5
        return Math.max(1, Math.min(5, Math.round((results.score / 25) * 5)));
      case 'PANAS':
        // Calculate based on positive-negative ratio
        const positive = results.positive || 0;
        const negative = results.negative || 0;
        const ratio = positive / (negative || 1);
        if (ratio > 2) return 5;
        if (ratio > 1.5) return 4;
        if (ratio > 0.8) return 3;
        if (ratio > 0.5) return 2;
        return 1;
      case 'PHQ9':
        // PHQ9 is inverse - higher scores = worse mood
        const score = results.score || 0;
        if (score < 5) return 5;
        if (score < 10) return 4;
        if (score < 15) return 3;
        if (score < 20) return 2;
        return 1;
      default:
        return 3;
    }
  };
  
  // Render the current question
  const renderQuestion = () => {
    const question = getCurrentQuestion();
    if (!question) return null;
    
    const questionText = typeof question === 'string' ? question : question.text;
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{questionText}</Text>
        
        <View style={styles.answersContainer}>
          {currentSurvey.scale.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.answerButton}
              onPress={() => handleAnswer(option.value)}
              disabled={isSubmitting}
            >
              <Text style={styles.answerValue}>{option.value}</Text>
              <Text style={styles.answerLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentSurvey.title}</Text>
        <Text style={styles.description}>{currentSurvey.description}</Text>
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progress}
          color="#FFD54F"
          style={styles.progressBar}
        />
        <Text style={styles.progress}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </View>
      
      {renderQuestion()}
      
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={isSubmitting}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
  },
  progress: {
    textAlign: 'center',
    color: '#888',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  answersContainer: {
    alignItems: 'center',
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
  },
  answerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  answerLabel: {
    fontSize: 16,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  }
});

export default ScientificSurvey; 