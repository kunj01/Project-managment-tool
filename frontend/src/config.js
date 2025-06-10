const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const config = {
  API_URL,
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    ME: `${API_URL}/auth/me`,
  },
  PROJECTS: {
    LIST: `${API_URL}/projects`,
    CREATE: `${API_URL}/projects`,
    UPDATE: (id) => `${API_URL}/projects/${id}`,
    DELETE: (id) => `${API_URL}/projects/${id}`,
  },
  TASKS: {
    LIST: (projectId) => `${API_URL}/tasks/project/${projectId}`,
    CREATE: `${API_URL}/tasks`,
    UPDATE: (id) => `${API_URL}/tasks/${id}`,
    DELETE: (id) => `${API_URL}/tasks/${id}`,
    MY_TASKS: `${API_URL}/tasks/my`,
  },
  EVENTS: {
    LIST: `${API_URL}/events`,
    CREATE: `${API_URL}/events`,
    UPDATE: (id) => `${API_URL}/events/${id}`,
    DELETE: (id) => `${API_URL}/events/${id}`,
  },
  USERS: {
    LIST: `${API_URL}/users`,
  },
};
