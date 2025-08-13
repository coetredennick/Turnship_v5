import { useState, useEffect } from "react";

// Use the environment variable if set, otherwise use relative URL for proxy
const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthData {
  user: User | null;
  profile: any;
}

export function useAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/user`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setAuthData(data);
        } else {
          setAuthData(null);
        }
      } catch (error) {
        console.error('Failed to fetch auth data:', error);
        setAuthData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAuth();
  }, []);

  return {
    user: authData?.user || null,
    profile: authData?.profile || null,
    loading,
    isAuthenticated: !!authData?.user
  };
}