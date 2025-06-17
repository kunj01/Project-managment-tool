// Format date to local string
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Format time to local string
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString();
};

// Get status color class for dark theme
export const getStatusColor = (status) => {
  switch (status) {
    case "To Do":
      return "bg-gray-600 text-gray-200 border border-gray-500";
    case "In Progress":
      return "bg-blue-600 text-blue-100 border border-blue-500";
    case "Done":
      return "bg-green-600 text-green-100 border border-green-500";
    default:
      return "bg-gray-600 text-gray-200 border border-gray-500";
  }
};

// Get priority color class for dark theme
export const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "text-red-400";
    case "Medium":
      return "text-yellow-400";
    case "Low":
      return "text-green-400";
    default:
      return "text-gray-400";
  }
};

// Format status text
export const formatStatus = (status) => {
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Get auth header
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return {};
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  return headers;
};