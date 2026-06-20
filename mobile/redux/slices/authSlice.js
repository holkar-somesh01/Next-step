import { createSlice } from '@reduxjs/toolkit';
import { setItem, deleteItem } from '../../utils/storage';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    justLoggedIn: false,
    isChatUnlocked: false,
    isAppUnlocked: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, justLoggedIn } = action.payload;
      state.user = user;
      state.token = token;
      state.justLoggedIn = !!justLoggedIn;
      if (token) {
        setItem('userToken', token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.justLoggedIn = false;
      state.isChatUnlocked = false;
      state.isAppUnlocked = false;
      deleteItem('userToken');
    },
    setChatUnlocked: (state, action) => {
      state.isChatUnlocked = action.payload;
    },
    setAppUnlocked: (state, action) => {
      state.isAppUnlocked = action.payload;
    },
  },
});

export const { setCredentials, logout, setChatUnlocked, setAppUnlocked } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsChatUnlocked = (state) => state.auth.isChatUnlocked;
export const selectIsAppUnlocked = (state) => state.auth.isAppUnlocked;
