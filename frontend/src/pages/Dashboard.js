import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Projects from "../components/Projects";
import Tasks from "../components/Tasks";
import Events from "../components/Events";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("projects");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white">Loading...</h2>
        </div>
      </div>
    );
  }

  const renderRoleBasedContent = () => {
    if (!user || !user.role) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-300">
            User role information is not available. Please try logging in again.
          </p>
        </div>
      );
    }

    switch (user.role) {
      case "project-manager":
        return (
          <div className="space-y-8">
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "projects"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "tasks"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Tasks
              </button>
            </div>
            
            {activeTab === "projects" && (
              <Projects
                onSelectProject={setSelectedProject}
                selectedProject={selectedProject}
              />
            )}
            {activeTab === "tasks" && (
              <div>
                {selectedProject ? (
                  <Tasks projectId={selectedProject._id} />
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-400 text-lg">Select a project to view tasks</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Choose a project from the Projects tab to manage its tasks
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "event-organizer":
        return <Events />;
      case "team-member":
        return (
          <div className="space-y-8">
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "projects"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                My Projects
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "tasks"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                My Tasks
              </button>
            </div>
            
            {activeTab === "projects" && (
              <Projects
                onSelectProject={setSelectedProject}
                selectedProject={selectedProject}
              />
            )}
            {activeTab === "tasks" && (
              <Tasks projectId={null} isMyTasksView={true} />
            )}
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-300">
              Your role ({user.role}) does not have specific dashboard content.
            </p>
          </div>
        );
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "project-manager":
        return "bg-purple-600 text-purple-100";
      case "event-organizer":
        return "bg-green-600 text-green-100";
      case "team-member":
        return "bg-blue-600 text-blue-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const formatRole = (role) => {
    return role
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">WP</span>
                  </div>
                  Workspace Planner
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.name && user?.role && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>
                      {formatRole(user.role)}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gray-800 shadow-xl rounded-xl border border-gray-700 p-6">
            {renderRoleBasedContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;