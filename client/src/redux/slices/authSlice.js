import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

// Load persisted state
const storedUser  = localStorage.getItem('shms_user');
const storedToken = localStorage.getItem('shms_token');

const safeParseUser = (raw) => {
  try { return raw ? JSON.parse(raw) : null; }
  catch { return null; }
};

// ── Thunks ──────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const res = await authService.login(credentials);
      return res.data; // { success, message, data: { user, token } }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Check your credentials.';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const res = await authService.register(userData);
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, thunkAPI) => {
    try {
      const res = await authService.updateProfile(data);
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Update failed.';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// ── Slice ────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:      safeParseUser(storedUser),
    token:     storedToken || null,
    isLoading: false,
    isError:   false,
    isSuccess: false,
    message:   '',
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('shms_user');
      localStorage.removeItem('shms_token');
      state.user      = null;
      state.token     = null;
      state.isSuccess = false;
      state.isError   = false;
      state.message   = '';
    },
    resetAuth: (state) => {
      state.isLoading = false;
      state.isError   = false;
      state.isSuccess = false;
      state.message   = '';
    },
  },
  extraReducers: (builder) => {
    // ���─ Login ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isError   = false;
        state.message   = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user      = action.payload.data.user;
        state.token     = action.payload.data.token;
        localStorage.setItem('shms_user',  JSON.stringify(action.payload.data.user));
        localStorage.setItem('shms_token', action.payload.data.token);
        toast.success(`Welcome back, ${action.payload.data.user.name}! 👋`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError   = true;
        state.message   = action.payload;
        toast.error(action.payload || 'Login failed');
      });

    // ── Register ──
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isError   = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user      = action.payload.data.user;
        state.token     = action.payload.data.token;
        localStorage.setItem('shms_user',  JSON.stringify(action.payload.data.user));
        localStorage.setItem('shms_token', action.payload.data.token);
        toast.success('Account created successfully! 🎉');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError   = true;
        state.message   = action.payload;
        toast.error(action.payload || 'Registration failed');
      });

    // ── Update Profile ──
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.data.user;
        localStorage.setItem('shms_user', JSON.stringify(action.payload.data.user));
        toast.success('Profile updated!');
      })
      .addCase(updateProfile.rejected, (state, action) => {
        toast.error(action.payload || 'Update failed');
      });
  },
});

export const { logout, resetAuth } = authSlice.actions;
export default authSlice.reducer;