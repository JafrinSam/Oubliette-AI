import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;

// ✨ INTEGRATED: CycloneDX ML-BOM Export — uses fetch (not axios) to handle binary Blob response
export const exportModelVersion = async (versionId, modelName, versionNum) => {
    try {
        const response = await fetch(`/api/models/versions/${versionId}/export`, {
            method: 'GET',
        });

        if (!response.ok) throw new Error('Failed to export model');

        const blob = await response.blob();

        // Trigger browser file-save dialog
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${modelName}_v${versionNum}_SecureExport.zip`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Export Error:', error);
        throw error;
    }
};
