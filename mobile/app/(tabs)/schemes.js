import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetSchemesQuery } from '../../redux/api/schemeApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TableRowSkeleton } from '../../components/Skeleton';

export default function UserSchemesScreen() {
  const { data: schemes, isLoading, isFetching, refetch } = useGetSchemesQuery();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-100">
        <Text className="text-gray-900 text-2xl font-bold">Available Schemes</Text>
        <TouchableOpacity onPress={() => refetch()} disabled={isFetching}>
          {isFetching && !isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="refresh-outline" size={24} color="#2563EB" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="p-4">
          {/* Table Header */}
          <View className="flex-row bg-blue-600 rounded-t-2xl py-4 px-4">
            <Text className="text-white font-bold w-40">Scheme Name</Text>
            <Text className="text-white font-bold w-60">Description</Text>
            <Text className="text-white font-bold w-50">Eligibility</Text>
            <Text className="text-white font-bold w-32 text-center">Action</Text>
          </View>

          {/* Table Body */}
          <FlatList
            data={isLoading ? [1, 2, 3, 4] : schemes}
            keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : item._id}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              if (isLoading) {
                return <TableRowSkeleton isEven={index % 2 === 0} />;
              }
              return (
                <TouchableOpacity 
                  onPress={() => router.push(`/scheme/${item._id}`)}
                  activeOpacity={0.7}
                  className={`flex-row px-4 py-6 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  style={{ borderBottomLeftRadius: index === schemes.length - 1 ? 16 : 0, borderBottomRightRadius: index === schemes.length - 1 ? 16 : 0 }}
                >
                  <View className="w-40 pr-4">
                    <Text className="text-gray-900 font-bold">{item.name}</Text>
                  </View>
                  <View className="w-60 pr-4">
                    <Text className="text-gray-600 text-sm" numberOfLines={3}>{item.description}</Text>
                  </View>
                  <View className="w-50 pr-4">
                    <Text className="text-blue-700 text-sm font-medium">{item.eligibilityCriteria}</Text>
                  </View>
                  <View className="w-32 items-center justify-center">
                    <View className="bg-blue-100 px-4 py-2 rounded-xl">
                      <Text className="text-blue-600 font-bold text-xs">Details</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => {
              if (isLoading) return null;
              return (
                <View className="items-center py-20 bg-gray-50 rounded-b-2xl w-[182px] border border-gray-100" style={{ width: '100%' }}>
                  <Ionicons name="information-circle-outline" size={48} color="#94a3b8" />
                  <Text className="text-gray-500 mt-4 font-medium">No schemes available at the moment.</Text>
                </View>
              );
            }}
          />
        </View>
      </ScrollView>
      
      <View className="px-6 py-4">
        <Text className="text-gray-400 text-xs text-center italic">Scroll horizontally to view all table columns</Text>
      </View>
    </SafeAreaView>
  );
}
