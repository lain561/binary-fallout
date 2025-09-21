// src/api/login.js
export const loginUser = async (username, password) => {
  try {
    const response = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store the token in localStorage - THIS IS THE KEY FIX
    localStorage.setItem('token', data.token);
    console.log('Token stored:', data.token);
    
    return data;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await fetch('http://localhost:5001/api/addUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

// Helper for checking authentication status
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper for logging out
export const logoutUser = () => {
  localStorage.removeItem('token');
};