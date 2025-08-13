import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export function useRouter() {
  const [, setLocation] = useLocation();
  
  const navigate = (path: string, options?: { state?: any }) => {
    // Store state in sessionStorage if provided
    if (options?.state) {
      sessionStorage.setItem(`navigation-state-${path}`, JSON.stringify(options.state));
    }
    
    // Navigate using wouter
    setLocation(path);
  };

  return { navigate };
}

export function useNavigationState(path: string) {
  const [state, setState] = useState<any>(null);
  
  useEffect(() => {
    const storedState = sessionStorage.getItem(`navigation-state-${path}`);
    if (storedState) {
      setState(JSON.parse(storedState));
      // Clear the state after using it
      sessionStorage.removeItem(`navigation-state-${path}`);
    }
  }, [path]);
  
  return state;
}