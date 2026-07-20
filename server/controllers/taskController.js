const Task = require('../models/Task');
const User = require('../models/User'); // NEW

// @desc  Get all tasks
// @route GET /api/tasks
// @access Admin
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single task
// @route GET /api/tasks/:id
// @access Admin
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a task
// @route POST /api/tasks
// @access Admin
const createTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body;

  try {
    // NEW - Validate assigned user
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findById(assignedTo);

      if (!assignedUser) {
        return res.status(404).json({
          message: 'Assigned user not found',
        });
      }

      if (assignedUser.role !== 'Talent') {
        return res.status(400).json({
          message: 'Tasks can only be assigned to Talent users',
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      assignedTo: assignedTo || null,
      dueDate,
      createdBy: req.user._id,
    });

    if (assignedUser) {
      console.log(
        `Notification: Task "${task.title}" has been assigned to ${assignedUser.name} (${assignedUser.email})`
      );
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a task
// @route PUT /api/tasks/:id
// @access Admin
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // NEW - Validate assigned user if updating
    if (req.body.assignedTo) {
      const user = await User.findById(req.body.assignedTo);

      if (!user) {
        return res.status(404).json({
          message: 'Assigned user not found',
        });
      }

      if (user.role !== 'Talent') {
        return res.status(400).json({
          message: 'Tasks can only be assigned to Talent users',
        });
      }
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (req.body.assignedTo && updated.assignedTo) {
      console.log(
        `Notification: Task "${updated.title}" has been assigned to ${updated.assignedTo.name} (${updated.assignedTo.email})`
      );
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete a task
// @route DELETE /api/tasks/:id
// @access Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Task deleted',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};