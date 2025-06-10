import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../config";
import { getAuthHeader } from "../utils";
import CreateProjectModal from "./CreateProjectModal";

const Projects = () => {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log(
    "Projects Component Render - user:",
    user,
    "authLoading:",
    authLoading
  );

  const fetchProjects = async () => {
    if (authLoading || !user) {
      console.log(
        "Projects fetchProjects: Skipping fetch due to authLoading or no user",
        { authLoading, user: user?.email }
      );
      setLoading(false);
      if (!user) setError("User not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeader();
      console.log(
        "Projects fetchProjects: Sending request with headers:",
        JSON.stringify(headers)
      );
      const response = await axios.get(config.PROJECTS.LIST, { headers });
      console.log(
        "Projects fetchProjects: Successfully fetched projects",
        response.data
      );
      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.message || "Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects();
    }
  }, [authLoading, user]);

  const handleCreateProject = async (projectData) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    try {
      const response = await axios.post(config.PROJECTS.CREATE, projectData, {
        headers: getAuthHeader(),
      });
      setProjects((prevProjects) => [...prevProjects, response.data]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    try {
      await axios.delete(config.PROJECTS.DELETE(projectId), getAuthHeader());
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project._id !== projectId)
      );
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.response?.data?.message || "Failed to delete project.");
    }
  };

  // Show loading state if authentication is still pending or local project fetching is in progress
  if (authLoading || loading) {
    return <div className="text-center py-4">Loading projects...</div>;
  }

  // If not loading but no user, this might be a fallback or an issue with ProtectedRoute
  if (!user) {
    return (
      <div className="text-center py-4 text-red-600">
        Authentication required to view projects.
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Projects</h2>
        {user?.role === "project-manager" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-500">No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {project.description}
              </p>
              <div className="flex items-center text-sm mb-2">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {project.status}
                </span>
              </div>
              {project.dueDate && (
                <p className="text-sm text-gray-500 mb-2">
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </p>
              )}
              {user?.role === "project-manager" && (
                <button
                  onClick={() => handleDeleteProject(project._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default Projects;
