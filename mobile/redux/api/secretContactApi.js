import { apiSlice } from './apiSlice';

export const secretContactApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSecretContacts: builder.query({
      query: () => '/secret-contacts',
      providesTags: ['SecretContact'],
    }),
    addSecretContact: builder.mutation({
      query: (data) => ({
        url: '/secret-contacts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SecretContact'],
    }),
    deleteSecretContact: builder.mutation({
      query: (id) => ({
        url: `/secret-contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SecretContact'],
    }),
  }),
});

export const {
  useGetSecretContactsQuery,
  useAddSecretContactMutation,
  useDeleteSecretContactMutation,
} = secretContactApi;
