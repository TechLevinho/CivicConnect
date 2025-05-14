import { auth } from './firebase';

/**
 * Helper function to make authenticated API requests to the backend
 * @param endpoint API endpoint path (e.g., '/issues')
 * @param options Fetch options (method, body, etc.)
 * @returns Response data
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get the current user token
    const token = await auth.currentUser?.getIdToken(true);

    // Prepare headers
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    
    // Add auth token if available
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Make the request
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText || 'An error occurred');
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Issue API functions
export const IssueApi = {
  // Get all issues
  getIssues: () => apiRequest('/issues'),
  
  // Get a specific issue
  getIssue: (id: string) => apiRequest(`/issues/${id}`),
  
  // Create a new issue
  createIssue: (data: any) => apiRequest('/report-issue', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Update an issue
  updateIssue: (id: string, data: any) => apiRequest(`/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  // Delete an issue
  deleteIssue: (id: string) => apiRequest(`/issues/${id}`, {
    method: 'DELETE'
  }),
  
  // Get user issues
  getUserIssues: () => apiRequest('/user/issues'),
  
  // Get organization issues
  getOrganizationIssues: () => apiRequest('/organization/issues'),
};

// Comment API functions
export const CommentApi = {
  // Get comments for an issue
  getComments: (issueId: string) => apiRequest(`/issues/${issueId}/comments`),
  
  // Add a comment to an issue
  addComment: (issueId: string, content: string) => apiRequest(`/issues/${issueId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
};

// User/Organization API functions
export const UserApi = {
  // Get current user info
  getCurrentUser: () => apiRequest('/auth/me'),
  
  // Create/update user profile
  createUserProfile: (data: any) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Create/update organization profile
  createOrganizationProfile: (data: any) => apiRequest('/organizations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
}; 