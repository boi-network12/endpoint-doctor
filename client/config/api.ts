// real endpoint: https://endpoint-doctor-backend.pxxl.click
// fake endpoint: http://localhost:5000

const API_BASE_URL = 'https://endpoint-doctor-backend.pxxl.click/api';

export const api = {
  analyze: {
    frontend: async (url: string) => {
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        const response = await fetch(`${API_BASE_URL}/analyze/frontend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("Request timeout - analysis took too long");
        }

        if (error instanceof Error) {
          if (error.message === "Failed to fetch") {
            throw new Error(
              "Cannot connect to server. Please ensure the backend server is running on port 5000"
            );
          }
          throw error;
        }

        throw new Error("An unknown error occurred");
      }
    },

    backend: async (endpoint: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${API_BASE_URL}/analyze/backend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error: unknown) {
          clearTimeout(timeoutId);

          if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request timeout - analysis took too long");
          }

          if (error instanceof Error) {
            if (error.message === "Failed to fetch") {
              throw new Error(
                "Cannot connect to server. Please ensure the backend server is running on port 5000"
              );
            }
            throw error;
          }

          throw new Error("An unknown error occurred");
        }
    },
  },
};