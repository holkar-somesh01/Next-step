import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getItem } from '../../utils/storage';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  prepareHeaders: async (headers) => {
    const token = await getItem('userToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Scheme', 'Contact', 'Chat', 'Exam', 'SecretContact', 'ChatConfig'],
  endpoints: (builder) => ({}),
});
