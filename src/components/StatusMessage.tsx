import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export const StatusMessage = ({ 
  isLoading = true,
  isSuccess = false,
  loadingMessage = "Processing...",
  resultMessage = ""
}) => {
  
  // Determine what to show
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.messageBox}>
          <ActivityIndicator size="large" color="#6B7280" style={styles.icon} />
          <Text style={[styles.messageText, styles.loadingText]}>
            {loadingMessage}
          </Text>
        </View>
      </View>
    );
  }

  // Show success or error result
  const isError = !isSuccess;
  const colors = isSuccess ? {
    iconColor: '#22C55E',
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    textColor: '#16A34A'
  } : {
    iconColor: '#EF4444',
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    textColor: '#DC2626'
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.messageBox,
        {
          borderColor: colors.borderColor,
          backgroundColor: colors.backgroundColor
        }
      ]}>
        <Ionicons 
          name={isSuccess ? 'checkmark-circle' : 'close-circle'} 
          size={48} 
          color={colors.iconColor} 
          style={styles.icon}
        />
        <Text style={[styles.messageText, { color: colors.textColor }]}>
          {resultMessage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  messageBox: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '90%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    color: '#6B7280',
  },
});