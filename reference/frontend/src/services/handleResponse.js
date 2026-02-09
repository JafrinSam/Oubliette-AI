export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  // Delete requests might returns 204 No Content
  if (response.status === 204) return null;
  return response.json();
};

