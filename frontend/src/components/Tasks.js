import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
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
      } else {
        setError("No project selected or invalid view for tasks.");
        setLoading(false);
        return;
      }

      const headers = getAuthHeader();
      const response = await axios.get(url, { headers });
      setTasks(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks.");
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
        getAuthHeader()
      );
      setTasks((prevTasks) => [...prevTasks, response.data]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task.");
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
        config.TASKS.UPDATE(taskId),
        { status: newStatus },
        getAuthHeader()
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === taskId ? response.data : task))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    try {
      await axios.delete(config.TASKS.DELETE(taskId), getAuthHeader());
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-4">Loading tasks...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-4 text-red-600">
        Authentication required to view tasks.
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          {isMyTasksView
            ? "My Tasks"
            : projectId
            ? `Tasks for Project: ${projectId}`
            : "Tasks"}
        </h2>
        {user?.role === "project-manager" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task._id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {task.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              <div className="flex items-center text-sm mb-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
                <span
                  className={`ml-2 text-xs font-semibold ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  Priority: {task.priority}
                </span>
              </div>
              {task.dueDate && (
                <p className="text-sm text-gray-500 mb-2">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
              {task.assignedTo && (
                <p className="text-sm text-gray-500 mb-2">
                  Assigned to: {task.assignedTo.name}
                </p>
              )}
              <div className="mt-4 flex space-x-2">
                {user?.role === "project-manager" && (
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                )}
                {(user?.role === "project-manager" ||
                  user?.role === "team-member") && (
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleUpdateStatus(task._id, e.target.value)
                    }
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                )}
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
