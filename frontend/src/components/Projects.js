import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContexts";
import { config } from "../config";
import { getAuthHeader } from "../utils";
import CreateProjectModal from "./CreateProjectModal";

const Projects = ({ onSelectProject, selectedProject }) => {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    if (authLoading || !user) {
      setLoading(false);
      if (!user) setError("User not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeader();
      const response = await axios.get(config.PROJECTS.LIST, { headers });
      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.message || "Failed to fetch projects.");
      toast.error("Failed to fetch projects");
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
      toast.success("Project created successfully!");
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.response?.data?.message || "Failed to create project.");
      toast.error(err.response?.data?.message || "Failed to create project");
    }
  };

  const handleDeleteProject = async (projectId) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(config.PROJECTS.DELETE(projectId), {
        headers: getAuthHeader(),
      });
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project._id !== projectId)
      );
      toast.success("Project deleted successfully!");
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.response?.data?.message || "Failed to delete project.");
      toast.error(err.response?.data?.message || "Failed to delete project");
    }
  };

  const handleUpdateStatus = async (projectId, newStatus) => {
    setError(null);
    if (!user) {
      setError("Not authenticated.");
      return;
    }
    try {
      const response = await axios.patch(
        config.PROJECTS.UPDATE_STATUS(projectId),
        { status: newStatus },
        { headers: getAuthHeader() }
      );
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === projectId ? response.data : project
        )
      );
      toast.success(`Project status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating project status:", err);
      setError(err.response?.data?.message || "Failed to update project status.");
      toast.error(err.response?.data?.message || "Failed to update project status");
    }
  };

  const handleSelectProject = (project) => {
    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Planning":
        return "bg-yellow-600 text-yellow-100 border border-yellow-500";
      case "Active":
        return "bg-green-600 text-green-100 border border-green-500";
      case "On Hold":
        return "bg-orange-600 text-orange-100 border border-orange-500";
      case "Completed":
        return "bg-blue-600 text-blue-100 border border-blue-500";
      default:
        return "bg-gray-600 text-gray-100 border border-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Planning":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case "Active":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "On Hold":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "Completed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading projects...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">Authentication required to view projects.</p>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {user?.role === "team-member" ? "My Projects" : "Projects"}
        </h2>
        {user?.role === "project-manager" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-400 text-lg">No projects found</p>
          <p className="text-gray-500 text-sm mt-2">
            {user?.role === "project-manager" 
              ? "Create your first project to get started" 
              : "You haven't been assigned to any projects yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className={`bg-gray-700 border border-gray-600 rounded-xl p-6 hover:bg-gray-650 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ${
                selectedProject?._id === project._id 
                  ? "ring-2 ring-blue-500 bg-gray-650" 
                  : ""
              }`}
              onClick={() => handleSelectProject(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-2">
                  {project.createdBy && project.createdBy._id === user.id && (
                    <span className="bg-purple-600 text-purple-100 text-xs px-2 py-1 rounded-full">
                      Owner
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {project.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{project.status}</span>
                  </span>
                  {user?.role === "project-manager" && project.createdBy && project.createdBy._id === user.id && (
                    <select
                      value={project.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(project._id, e.target.value);
                      }}
                      className="text-xs bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  )}
                </div>

                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Team Members</p>
                    <div className="flex -space-x-2">
                      {project.teamMembers.slice(0, 3).map((member, index) => (
                        <div
                          key={member._id || index}
                          className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-700"
                          title={member.name}
                        >
                          <span className="text-white text-xs font-medium">
                            {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                          </span>
                        </div>
                      ))}
                      {project.teamMembers.length > 3 && (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-700">
                          <span className="text-gray-300 text-xs">
                            +{project.teamMembers.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  {user?.role === "project-manager" && project.createdBy && project.createdBy._id === user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project._id);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm p-1 rounded transition-colors"
                      title="Delete project"
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

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default Projects;