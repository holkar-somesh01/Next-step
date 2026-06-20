import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetSchemesQuery } from '../../redux/api/schemeApi';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Static images for the carousel
const CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

export default function SchemeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const { isDark, colors: c } = useTheme();

  
  // Use the existing query to get the scheme data. 
  // It should be cached if we just came from the list screen.
  const { data: schemes, isLoading } = useGetSchemesQuery();
  
  const scheme = schemes?.find(s => s._id === id);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextSlide = activeSlide + 1;
      if (nextSlide >= CAROUSEL_IMAGES.length) {
        nextSlide = 0;
      }
      setActiveSlide(nextSlide);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextSlide * width, animated: true });
      }
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [activeSlide]);


  const handleApply = () => {
    if (scheme?.link) {
      Linking.openURL(scheme.link).catch((err) => console.error("Couldn't load page", err));
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!scheme) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.cardBorder, backgroundColor: c.card }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Scheme Not Found</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={64} color={c.subText} />
          <Text style={{ color: c.subText, marginTop: 16, textAlign: 'center', fontSize: 15 }}>The scheme you are looking for does not exist or has been removed.</Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.cardBorder, backgroundColor: c.card, zIndex: 10 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          Scheme Details
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Carousel */}
        <View style={{ height: 256, backgroundColor: isDark ? '#1a1a2e' : '#f1f5f9' }}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const slide = Math.round(event.nativeEvent.contentOffset.x / width);
              setActiveSlide(slide);
            }}
          >
            {CAROUSEL_IMAGES.map((imgUrl, index) => (
              <Image 
                key={index}
                source={{ uri: imgUrl }}
                style={{ width, height: 256 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View className="absolute bottom-4 flex-row w-full justify-center space-x-2">
            {CAROUSEL_IMAGES.map((_, index) => (
              <View 
                key={index} 
                className={`h-2 rounded-full ${index === activeSlide ? 'bg-blue-600 w-4' : 'bg-white opacity-70 w-2'}`}
                style={index > 0 ? { marginLeft: 8 } : {}}
              />
            ))}
          </View>
        </View>

        {/* Details Section */}
        <View style={{ padding: 24 }}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: c.text, marginBottom: 8 }}>{scheme.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Ionicons name="shield-checkmark" size={16} color="#2563EB" />
              <Text style={{ color: '#2563EB', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>Government Scheme</Text>
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: c.text, marginBottom: 8 }}>Description</Text>
            <Text style={{ color: c.subText, lineHeight: 22, fontSize: 14 }}>
              {scheme.description}
            </Text>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: c.text, marginBottom: 8 }}>Eligibility Criteria</Text>
            <View style={{ backgroundColor: c.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'start' }}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ color: c.text, lineHeight: 22, flex: 1, fontSize: 14 }}>
                  {scheme.eligibilityCriteria}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Buttons */}
      <View style={{ padding: 16, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.cardBorder, paddingBottom: 32, flexDirection: 'row' }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ flex: 1, backgroundColor: isDark ? '#252540' : '#F1F5F9', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
        >
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleApply}
          style={{ flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginRight: 8 }}>Apply Now</Text>
          <Ionicons name="open-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
