import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectService from '../../services/projectService';
import toast from 'react-hot-toast';

const defaultPagination = { total: 0, page: 1, limit: 10, pages: 1 };

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await projectService.getProjects(params);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to fetch projects');
  }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await projectService.getProject(id);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to fetch project');
  }
});

export const createProject = createAsyncThunk('projects/create', async (data, thunkAPI) => {
  try {
    const res = await projectService.createProject(data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to create project');
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }, thunkAPI) => {
  try {
    const res = await projectService.updateProject(id, data);
    return res.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to update project');
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, thunkAPI) => {
  try {
    await projectService.deleteProject(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Failed to delete project');
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    project: null,
    pagination: defaultPagination,
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    clearProject: (state) => {
      state.project = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload?.data?.projects || [];
        state.pagination = action.payload?.data?.pagination || defaultPagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
        state.pagination = defaultPagination;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.project = action.payload?.data?.project || null;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        toast.error(action.payload);
      })
      .addCase(createProject.fulfilled, (state, action) => {
        const p = action.payload?.data?.project;
        if (p) state.projects.unshift(p);
        toast.success('Project created successfully!');
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const p = action.payload?.data?.project;
        if (!p) return;
        const idx = state.projects.findIndex((x) => x._id === p._id);
        if (idx !== -1) state.projects[idx] = p;
        state.project = p;
        toast.success('Project updated!');
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((x) => x._id !== action.payload);
        toast.success('Project deleted!');
      });
  },
});

export const { clearProject } = projectSlice.actions;
export default projectSlice.reducer;