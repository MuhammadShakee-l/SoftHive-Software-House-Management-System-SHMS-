import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import clientService from '../../services/clientService';
import toast from 'react-hot-toast';

const defaultPagination = { total: 0, page: 1, limit: 10, pages: 1 };

export const fetchClients = createAsyncThunk('clients/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await clientService.getClients(params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to fetch clients');
  }
});

export const createClient = createAsyncThunk('clients/create', async (data, thunkAPI) => {
  try {
    const res = await clientService.createClient(data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to create client');
  }
});

export const updateClient = createAsyncThunk('clients/update', async ({ id, data }, thunkAPI) => {
  try {
    const res = await clientService.updateClient(id, data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to update client');
  }
});

export const deleteClient = createAsyncThunk('clients/delete', async (id, thunkAPI) => {
  try {
    await clientService.deleteClient(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to delete client');
  }
});

const clientSlice = createSlice({
  name: 'clients',
  initialState: {
    clients: [],
    pagination: defaultPagination,
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    resetClients: (state) => {
      state.clients = [];
      state.pagination = defaultPagination;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload?.data?.clients || [];
        state.pagination = action.payload?.data?.pagination || defaultPagination;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
        state.pagination = defaultPagination;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        const c = action.payload?.data?.client;
        if (c) state.clients.unshift(c);
        toast.success('Client added!');
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const c = action.payload?.data?.client;
        if (!c) return;
        const idx = state.clients.findIndex((x) => x._id === c._id);
        if (idx !== -1) state.clients[idx] = c;
        toast.success('Client updated!');
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter((x) => x._id !== action.payload);
        toast.success('Client removed!');
      });
  },
});

export const { resetClients } = clientSlice.actions;
export default clientSlice.reducer;