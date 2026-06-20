import { apiSlice } from './apiSlice';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatHistory: builder.query({
      query: (receiverId) => `/chats/${receiverId}`,
      providesTags: ['Chat'],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: '/chats',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),
    editMessage: builder.mutation({
      query: ({ messageId, message }) => ({
        url: `/chats/${messageId}`,
        method: 'PUT',
        body: { message },
      }),
      invalidatesTags: ['Chat'],
    }),
    deleteMessage: builder.mutation({
      query: (messageId) => ({
        url: `/chats/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useGetChatHistoryQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} = chatApi;
