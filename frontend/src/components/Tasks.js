import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContexts";
import CreateTaskModal from "./CreateTaskModal";
import { config } from "../config";
import { getAuthHeader, getStatusColor, getPriorityColor } from "../utils";

const Tasks = ({ projectId, isMyTasksView = false }) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const fetchTasks = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      if (!user) setError("User not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let url;
      if (isMyTasksView) {
        url = config.TASKS.MY_TASKS;
      } else if (projectId) {
        if (typeof config.TASKS.LIST === "function") {
          url = config.TASKS.LIST(projectId);
        } else {
          setError("Configuration error: Tasks list endpoint is not callable.");
          setLoading(false);
          return;
        }
      } else if (user?.role === "project-manager") {
        // Project managers can view all tasks
        url = config.TASKS.ALL_TASKS;
      } else {
        setError("No project selected or insufficient permissions to view tasks.");
        setLoading(false);
        return;
      }

      const headers = getAuthHeader();
      const response = await axios.get(url, { headers });
      setTasks(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks.");
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [projectId, isMyTasksView, user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTasks();
    }
  }, [fetchTasks, authLoading, user]);

  const handleCreateTask = async (taskData) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    try {
      const response = await axios.post(
        config.TASKS.CREATE,
        taskData,
        { headers: getAuthHeader() }
      );
      
      // Refresh the tasks list to show the new task
      await fetchTasks();
      
      setIsModalOpen(false);
      toast.success("Task created successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task.");
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    try {
      const response = await axios.put(
        config.TASKS.UPDATE_STATUS(taskId),
        { status: newStatus },
        { headers: getAuthHeader() }
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === taskId ? response.data : task))
      );
      toast.success(`Task status updated to ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status.");
      toast.error(err.response?.data?.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(config.TASKS.DELETE(taskId), { headers: getAuthHeader() });
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
      toast.success("Task deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task.");
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading tasks...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">Authentication required to view tasks.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">Error: {error}</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "To Do":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "In Progress":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "Done":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "High":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case "Medium":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "Low":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {isMyTasksView
            ? "My Tasks"
            : projectId
            ? "Project Tasks"
            : user?.role === "project-manager"
            ? "All Tasks"
            : "Tasks"}
        </h2>
        {user?.role === "project-manager" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        )}

      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-400 text-lg">No tasks found</p>
          <p className="text-gray-500 text-sm mt-2">
            {isMyTasksView 
              ? "You don't have any assigned tasks yet" 
              : projectId
              ? "No tasks have been created for this project"
              : user?.role === "project-manager"
              ? "No tasks have been created yet"
              : "No tasks found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task._id} className="bg-gray-700 border border-gray-600 rounded-xl p-6 hover:bg-gray-650 transition-all duration-200 shadow-lg hover:shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {task.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="ml-1">{task.status}</span>
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {task.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityIcon(task.priority)}
                    <span className="ml-1">Priority: {task.priority}</span>
                  </div>
                </div>
                
                {task.dueDate && (
                  <div className="flex items-center text-xs text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                
                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div className="flex items-center text-xs text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assigned to: {task.assignedTo[0]?.name || "Unknown"}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                    className="text-xs bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  
                  {user?.role === "project-manager" && (
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                      title="Delete task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        projectId={projectId}
      />
    </div>
  );
};

export default Tasks;