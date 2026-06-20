import { apiSlice } from './apiSlice';

export const schemeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSchemes: builder.query({
      query: () => '/schemes',
      providesTags: ['Scheme'],
    }),
    addScheme: builder.mutation({
      query: (newScheme) => ({
        url: '/schemes',
        method: 'POST',
        body: newScheme,
      }),
      invalidatesTags: ['Scheme'],
    }),
    updateScheme: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/schemes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Scheme'],
    }),
    deleteScheme: builder.mutation({
      query: (id) => ({
        url: `/schemes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Scheme'],
    }),
  }),
});

export const { 
  useGetSchemesQuery, 
  useAddSchemeMutation, 
  useUpdateSchemeMutation, 
  useDeleteSchemeMutation 
} = schemeApi;
