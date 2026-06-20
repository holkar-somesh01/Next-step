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
    clearChatHistory: builder.mutation({
      query: (receiverId) => ({
        url: `/chats/clear/${receiverId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SecretContact', 'Chat'],
    }),
    markAsRead: builder.mutation({
      query: (senderId) => ({
        url: `/chats/read/${senderId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['SecretContact', 'Chat'],
    }),
  }),
});

export const {
  useGetChatHistoryQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useClearChatHistoryMutation,
  useMarkAsReadMutation,
} = chatApi;
