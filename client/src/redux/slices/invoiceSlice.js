import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import invoiceService from '../../services/invoiceService';
import toast from 'react-hot-toast';

const defaultPagination = { total: 0, page: 1, limit: 10, pages: 1 };

export const fetchInvoices = createAsyncThunk('invoices/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await invoiceService.getInvoices(params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to fetch invoices');
  }
});

export const createInvoice = createAsyncThunk('invoices/create', async (data, thunkAPI) => {
  try {
    const res = await invoiceService.createInvoice(data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to create invoice');
  }
});

export const updateInvoice = createAsyncThunk('invoices/update', async ({ id, data }, thunkAPI) => {
  try {
    const res = await invoiceService.updateInvoice(id, data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to update invoice');
  }
});

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
    pagination: defaultPagination,
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    resetInvoices: (state) => {
      state.invoices = [];
      state.pagination = defaultPagination;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload?.data?.invoices || [];
        state.pagination = action.payload?.data?.pagination || defaultPagination;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
        state.pagination = defaultPagination;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        const inv = action.payload?.data?.invoice;
        if (inv) state.invoices.unshift(inv);
        toast.success('Invoice created!');
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const inv = action.payload?.data?.invoice;
        if (!inv) return;
        const idx = state.invoices.findIndex((x) => x._id === inv._id);
        if (idx !== -1) state.invoices[idx] = inv;
        toast.success('Invoice updated!');
      })
      .addCase(updateInvoice.rejected, (state, action) => toast.error(action.payload));
  },
});

export const { resetInvoices } = invoiceSlice.actions;
export default invoiceSlice.reducer;