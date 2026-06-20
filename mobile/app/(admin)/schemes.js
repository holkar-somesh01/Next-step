import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAddSchemeMutation, useUpdateSchemeMutation, useGetSchemesQuery } from '../../redux/api/schemeApi';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SchemeFormScreen() {
  const router = useRouter();
  const { id, edit } = useLocalSearchParams();
  const isEdit = edit === 'true';
  const { isDark: dark, colors: c } = useTheme();
  
  const { data: schemes } = useGetSchemesQuery();
  const currentScheme = schemes?.find(s => s._id === id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [addScheme, { isLoading: isAdding }] = useAddSchemeMutation();
  const [updateScheme, { isLoading: isUpdating }] = useUpdateSchemeMutation();

  const isLoading = isAdding || isUpdating;

  useEffect(() => {
    if (isEdit && currentScheme) {
      setName(currentScheme.name);
      setDescription(currentScheme.description);
      setLink(currentScheme.link);
      setEligibilityCriteria(currentScheme.eligibilityCriteria);
      setCategory(currentScheme.category || '');
      setDeadline(currentScheme.deadline || '');
    }
  }, [isEdit, currentScheme]);

  const handleSubmit = async () => {
    if (!name || !description || !link || !eligibilityCriteria) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const data = { name, description, link, eligibilityCriteria, category, deadline };

    try {
      if (isEdit) {
        await updateScheme({ id, ...data }).unwrap();
        Alert.alert('Success', 'Scheme updated successfully');
      } else {
        await addScheme(data).unwrap();
        Alert.alert('Success', 'Scheme added successfully');
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error.data?.message || `Failed to ${isEdit ? 'update' : 'add'} scheme`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: c.bg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={dark ? ['#1e1b4b', '#0f172a'] : ['#1E3A8A', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Update Scheme' : 'Add New Scheme'}</Text>
          <Text style={styles.headerSubtitle}>
            {isEdit ? 'Modify details of the existing educational program' : 'Publish details for a new educational scheme'}
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={[styles.formCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            
            {/* Scheme Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.label }]}>Scheme Name</Text>
              <TextInput
                style={[styles.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                placeholder="e.g. National Scholarship Portal"
                placeholderTextColor={c.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.label }]}>Category</Text>
              <TextInput
                style={[styles.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                placeholder="e.g. Scholarship, Loan, Grant"
                placeholderTextColor={c.placeholder}
                value={category}
                onChangeText={setCategory}
              />
            </View>

            {/* Deadline */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.label }]}>Application Deadline</Text>
              <TextInput
                style={[styles.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                placeholder="e.g. 31st Dec 2026"
                placeholderTextColor={c.placeholder}
                value={deadline}
                onChangeText={setDeadline}
              />
            </View>

            {/* Application Link */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.label }]}>Application Link</Text>
              <TextInput
                style={[styles.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                placeholder="https://example.com"
                placeholderTextColor={c.placeholder}
                value={link}
                onChangeText={setLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.label }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                placeholder="Describe the scheme objective, funding amount, etc..."
                placeholderTextColor={c.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Eligibility Criteria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.label }]}>Eligibility Criteria</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
                placeholder="Who is eligible? (academic requirements, income limits, etc.)"
                placeholderTextColor={c.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={eligibilityCriteria}
                onChangeText={setEligibilityCriteria}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[
                styles.submitButton, 
                { backgroundColor: dark ? '#818CF8' : '#2563EB' },
                isLoading && { opacity: 0.7 }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons name={isEdit ? "save-outline" : "add-circle-outline"} size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    {isEdit ? 'Save Changes' : 'Publish Scheme'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  formCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
