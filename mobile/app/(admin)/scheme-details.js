import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGetSchemesQuery, useDeleteSchemeMutation } from '../../redux/api/schemeApi';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminSchemeDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isDark: dark, colors: c } = useTheme();

  const { data: schemes, isLoading } = useGetSchemesQuery();
  const [deleteScheme] = useDeleteSchemeMutation();

  const scheme = schemes?.find(s => s._id === id);

  const handleDelete = () => {
    Alert.alert(
      'Delete Scheme',
      'Are you sure you want to delete this scheme? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheme(id).unwrap();
              Alert.alert('Success', 'Scheme deleted successfully');
              router.back();
            } catch (_err) {
              Alert.alert('Error', 'Failed to delete scheme');
            }
          }
        }
      ]
    );
  };

  const openLink = async (url) => {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (_e) {
      Alert.alert('Error', 'An error occurred while trying to open the link');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={dark ? '#A5B4FC' : '#2563EB'} />
      </SafeAreaView>
    );
  }

  if (!scheme) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <LinearGradient
          colors={dark ? ['#1e1b4b', '#0f172a'] : ['#1E3A8A', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="warning-outline" size={54} color={c.subText} style={{ marginBottom: 12 }} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '600' }}>Scheme not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Dynamic Header */}
        <LinearGradient
          colors={dark ? ['#1e1b4b', '#0f172a'] : ['#1E3A8A', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => router.push({ pathname: '/(admin)/schemes', params: { id: scheme._id, edit: true } })}
                style={[styles.actionIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDelete}
                style={[styles.actionIconButton, { backgroundColor: 'rgba(239, 68, 68, 0.5)' }]}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.categoryPill, { backgroundColor: dark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(255, 255, 255, 0.25)' }]}>
              <Text style={styles.categoryText}>{scheme.category || 'General Scheme'}</Text>
            </View>
            <Text style={styles.title} numberOfLines={3}>{scheme.name}</Text>
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          
          {/* Main Card */}
          <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            
            {/* Description Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={20} color={dark ? '#818CF8' : '#2563EB'} />
                <Text style={[styles.sectionTitle, { color: c.text }]}>Description</Text>
              </View>
              <Text style={[styles.bodyText, { color: c.subText }]}>
                {scheme.description}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: c.rowBorder }]} />

            {/* Eligibility Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color={dark ? '#818CF8' : '#2563EB'} />
                <Text style={[styles.sectionTitle, { color: c.text }]}>Eligibility Criteria</Text>
              </View>
              <Text style={[styles.bodyText, { color: c.subText }]}>
                {scheme.eligibilityCriteria}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: c.rowBorder }]} />

            {/* Application Deadline */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={dark ? '#818CF8' : '#2563EB'} />
                <Text style={[styles.sectionTitle, { color: c.text }]}>Application Deadline</Text>
              </View>
              <Text style={[styles.bodyText, { color: c.subText, fontWeight: '500' }]}>
                {scheme.deadline || 'No deadline specified'}
              </Text>
            </View>

          </View>

          {/* Quick Info Grid */}
          <View style={styles.quickInfoGrid}>
            <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Ionicons name="time-outline" size={24} color={dark ? '#A5B4FC' : '#4F46E5'} />
              <Text style={[styles.infoLabel, { color: c.subText }]}>Created At</Text>
              <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={1}>
                {scheme.createdAt ? new Date(scheme.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Ionicons name="sync-outline" size={24} color={dark ? '#6EE7B7' : '#059669'} />
              <Text style={[styles.infoLabel, { color: c.subText }]}>Updated At</Text>
              <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={1}>
                {scheme.updatedAt ? new Date(scheme.updatedAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.rowBorder }]}>
        <TouchableOpacity 
          style={[styles.applyButton, { backgroundColor: dark ? '#818CF8' : '#2563EB' }]}
          onPress={() => openLink(scheme.link)}
        >
          <Ionicons name="globe-outline" size={20} color="white" />
          <Text style={styles.applyButtonText}>Visit Official Portal</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    marginTop: 10,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 34,
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
  },
  detailsCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  section: {
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    marginLeft: 28,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 28,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
