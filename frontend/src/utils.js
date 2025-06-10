// Format date to local string
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Format time to local string
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString();
};

// Get status color class
export const getStatusColor = (status) => {
  switch (status) {
    case "To Do":
      return "bg-gray-200 text-gray-800";
    case "In Progress":
      return "bg-blue-200 text-blue-800";
    case "Done":
      return "bg-green-200 text-green-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Get priority color class
export const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "text-red-600";
    case "Medium":
      return "text-yellow-600";
    case "Low":
      return "text-green-600";
    default:
      return "text-gray-600";
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
  console.log(
    "getAuthHeader: Retrieved token from localStorage:",
    token ? "Token found" : "No token"
  );
  console.log(
    "getAuthHeader: Full token value (first 10 chars):",
    token ? token.substring(0, 10) + "..." : "N/A"
  );
  if (!token) {
    console.log("getAuthHeader: No token found, returning empty headers");
    return {};
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  console.log("getAuthHeader: Returning headers:", JSON.stringify(headers));
  return headers;
};
