const User = require('../models/User');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Admin, Manager
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    let userQuery = {};
    let employeeQuery = {};

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && role !== 'all') userQuery.role = role;
    if (department && department !== 'all') employeeQuery.department = department;

    const users = await User.find({ ...userQuery, role: { $in: ['developer', 'manager'] } }).select('_id');
    const userIds = users.map((u) => u._id);

    const total = await Employee.countDocuments({ user: { $in: userIds }, ...employeeQuery });
    const employees = await Employee.find({ user: { $in: userIds }, ...employeeQuery })
      .populate('user', 'name email role phone avatar isActive lastLogin')
      .populate('assignedProjects', 'name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Employees fetched', {
      employees,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Admin, Manager
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'name email role phone avatar isActive lastLogin')
      .populate('assignedProjects', 'name status deadline progress');

    if (!employee) return errorResponse(res, 404, 'Employee not found');

    // Get task stats
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: employee.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return successResponse(res, 200, 'Employee fetched', { employee, taskStats });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create employee (Admin only)
// @route   POST /api/employees
// @access  Admin
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, phone, department, designation, salary, skills } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return errorResponse(res, 400, 'Email already in use');

    const user = await User.create({ name, email, password, role: role || 'developer', phone });

    const employee = await Employee.create({
      user: user._id,
      department,
      designation,
      salary,
      skills: skills ? skills.split(',').map((s) => s.trim()) : [],
    });

    await employee.populate('user', 'name email role phone avatar');

    return successResponse(res, 201, 'Employee created successfully', { employee });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Admin
const updateEmployee = async (req, res) => {
  try {
    const { name, phone, department, designation, salary, skills, isActive, performanceRating } = req.body;

    const employee = await Employee.findById(req.params.id).populate('user');
    if (!employee) return errorResponse(res, 404, 'Employee not found');

    // Update user fields
    await User.findByIdAndUpdate(employee.user._id, { name, phone, isActive }, { new: true });

    // Update employee fields
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { department, designation, salary, skills: skills ? skills.split(',').map((s) => s.trim()) : [], performanceRating },
      { new: true, runValidators: true }
    ).populate('user', 'name email role phone avatar isActive');

    return successResponse(res, 200, 'Employee updated', { employee: updatedEmployee });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Admin
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return errorResponse(res, 404, 'Employee not found');

    await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'Employee deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };