import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    updatePublicKey: builder.mutation({
      query: (data) => ({
        url: '/auth/public-key',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useUpdatePublicKeyMutation } = authApi;
