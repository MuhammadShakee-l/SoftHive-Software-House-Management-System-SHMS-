import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskService from '../../services/taskService';
import toast from 'react-hot-toast';

const defaultPagination = { total: 0, page: 1, limit: 10, pages: 1 };

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await taskService.getTasks(params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/create', async (data, thunkAPI) => {
  try {
    const res = await taskService.createTask(data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }, thunkAPI) => {
  try {
    const res = await taskService.updateTask(id, data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to update task');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, thunkAPI) => {
  try {
    await taskService.deleteTask(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to delete task');
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    task: null,
    pagination: defaultPagination,
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    resetTasks: (state) => {
      state.tasks = [];
      state.pagination = defaultPagination;
      state.task = null;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload?.data?.tasks || [];
        state.pagination = action.payload?.data?.pagination || defaultPagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
        state.pagination = defaultPagination;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const t = action.payload?.data?.task;
        if (t) state.tasks.unshift(t);
        toast.success('Task created!');
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const t = action.payload?.data?.task;
        if (!t) return;
        const idx = state.tasks.findIndex((x) => x._id === t._id);
        if (idx !== -1) state.tasks[idx] = t;
        toast.success('Task updated!');
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((x) => x._id !== action.payload);
        toast.success('Task deleted!');
      });
  },
});

export const { resetTasks } = taskSlice.actions;
export default taskSlice.reducer;