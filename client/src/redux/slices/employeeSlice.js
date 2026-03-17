import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';

const defaultPagination = { total: 0, page: 1, limit: 10, pages: 1 };

export const fetchEmployees = createAsyncThunk('employees/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await employeeService.getEmployees(params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to fetch employees');
  }
});

export const createEmployee = createAsyncThunk('employees/create', async (data, thunkAPI) => {
  try {
    const res = await employeeService.createEmployee(data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to create employee');
  }
});

export const updateEmployee = createAsyncThunk('employees/update', async ({ id, data }, thunkAPI) => {
  try {
    const res = await employeeService.updateEmployee(id, data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to update employee');
  }
});

export const deleteEmployee = createAsyncThunk('employees/delete', async (id, thunkAPI) => {
  try {
    await employeeService.deleteEmployee(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to delete employee');
  }
});

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    pagination: defaultPagination,
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    resetEmployees: (state) => {
      state.employees = [];
      state.pagination = defaultPagination;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload?.data?.employees || [];
        state.pagination = action.payload?.data?.pagination || defaultPagination;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
        state.pagination = defaultPagination;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        const emp = action.payload?.data?.employee;
        if (emp) state.employees.unshift(emp);
        toast.success('Employee added successfully!');
      })
      .addCase(createEmployee.rejected, (state, action) => toast.error(action.payload))
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const emp = action.payload?.data?.employee;
        if (!emp) return;
        const idx = state.employees.findIndex((e) => e._id === emp._id);
        if (idx !== -1) state.employees[idx] = emp;
        toast.success('Employee updated!');
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter((e) => e._id !== action.payload);
        toast.success('Employee removed!');
      })
      .addCase(deleteEmployee.rejected, (state, action) => toast.error(action.payload));
  },
});

export const { resetEmployees } = employeeSlice.actions;
export default employeeSlice.reducer;