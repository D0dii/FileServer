const API_BASE_URL = "http://localhost:8080";

// Get the stored password from localStorage for authentication
const getAuthToken = () => {
  const storedPassword = localStorage.getItem("userPassword");
  return storedPassword ? storedPassword.replace(/"/g, "") : null;
};

// Create headers with authorization
const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// List all files
export const listFiles = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: "GET",
    headers: createAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }

  return response.json();
};

// Upload a file
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.text();
};

// Delete a file
export const deleteFile = async (filename: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/files/${filename}`, {
    method: "DELETE",
    headers: createAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete file");
  }

  return response.text();
};

// Download a file
export const downloadFile = async (filename: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
    method: "GET",
    headers: createAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  return response.blob();
};

// Disk usage types
export interface DiskUsage {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  totalGB: number;
  freeGB: number;
  usedGB: number;
  usedPercentage: number;
}

// Get disk usage
export const getDiskUsage = async (): Promise<DiskUsage> => {
  const response = await fetch(`${API_BASE_URL}/disk-usage`, {
    method: "GET",
    headers: createAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch disk usage");
  }

  return response.json();
};
