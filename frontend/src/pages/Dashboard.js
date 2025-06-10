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

  console.log("Dashboard Component Render - user:", user, "loading:", loading);

  useEffect(() => {
    if (!loading && !user) {
      console.error(
        "Dashboard: user is null after loading. Redirecting to login. This should be handled by ProtectedRoute."
      );
      navigate("/login");
    }
  }, [loading, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  const renderRoleBasedContent = () => {
    if (!user || !user.role) {
      console.warn(
        "renderRoleBasedContent: user or role is missing, falling back to default content."
      );
      return (
        <p>
          User role information is not available. Please try logging in again.
        </p>
      );
    }

    switch (user.role) {
      case "project-manager":
        return (
          <div className="space-y-8">
            <Projects
              onSelectProject={setSelectedProject}
              selectedProject={selectedProject}
            />
            {selectedProject && <Tasks projectId={selectedProject._id} />}
          </div>
        );
      case "event-organizer":
        return <Events />;
      case "team-member":
        return (
          <div className="space-y-8">
            <Tasks projectId={null} isMyTasksView={true} />
          </div>
        );
      default:
        return (
          <p>
            Your role ({user.role}) does not have specific dashboard content.
          </p>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Workspace Event Planner
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              {user?.name && user?.role && (
                <span className="text-gray-700 mr-4">
                  Welcome, {user.name} ({user.role})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            {renderRoleBasedContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
