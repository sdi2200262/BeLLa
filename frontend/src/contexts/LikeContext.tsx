import React, { createContext, useContext, useState, useCallback } from 'react';
import { API_BASE_URL, defaultFetchOptions, handleResponse } from '@/config/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface LikeContextType {
  likedProjects: Record<string, boolean>;
  likeCounts: Record<string, number>;
  toggleLike: (projectId: string) => Promise<void>;
  refreshLikes: (projectIds: string[]) => Promise<void>;
  isLikeLoading: Record<string, boolean>;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const { getAuthToken, user } = useAuth();
  const [likedProjects, setLikedProjects] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [isLikeLoading, setIsLikeLoading] = useState<Record<string, boolean>>({});
  
  // Keep track of pending refreshes to prevent duplicate calls
  const pendingRefreshes = React.useRef<Record<string, boolean>>({});

  const refreshLikes = useCallback(async (projectIds: string[]) => {
    if (!user || !projectIds.length) return;
    
    try {
      const token = getAuthToken();
      if (!token) return;

      // Filter out any invalid project IDs (must be 24 hex characters)
      const validProjectIds = projectIds.filter(id => {
        const isValid = id && /^[0-9a-fA-F]{24}$/.test(id);
        if (!isValid) {
          console.warn(`Skipping invalid project ID: ${id}`);
        }
        return isValid;
      });
      
      if (validProjectIds.length === 0) {
        console.log('No valid project IDs to refresh likes for');
        return;
      }

      // Create a cache key based on the current time
      // Only refresh if it's been more than 5 seconds since the last refresh for these IDs
      const now = Date.now();
      const cacheKey = validProjectIds.sort().join(',');
      const lastRefreshTime = (window as any)._likeRefreshCache?.[cacheKey] || 0;
      
      if (now - lastRefreshTime < 5000) {
        console.log('Skipping refresh - too soon since last refresh');
        return;
      }
      
      // Check if we're already refreshing these IDs
      if (pendingRefreshes.current[cacheKey]) {
        console.log('Skipping refresh - already in progress');
        return;
      }
      
      // Mark this refresh as pending
      pendingRefreshes.current[cacheKey] = true;
      
      // Update the cache time
      if (!(window as any)._likeRefreshCache) {
        (window as any)._likeRefreshCache = {};
      }
      (window as any)._likeRefreshCache[cacheKey] = now;

      // Get like counts with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Only make the API call if we have valid project IDs
        if (validProjectIds.length > 0) {
          const countsResponse = await fetch(`${API_BASE_URL}/likes/counts`, {
            method: 'POST',
            ...defaultFetchOptions,
            headers: {
              ...defaultFetchOptions.headers,
              Authorization: `Bearer ${token}`
            } as HeadersInit,
            body: JSON.stringify({ projectIds: validProjectIds }),
            signal: controller.signal
          });
          
          const countsData = await handleResponse<{ counts: Record<string, number> }>(countsResponse);
          
          // Update like counts atomically
          setLikeCounts(prev => ({
            ...prev,
            ...countsData.counts
          }));
        }
      } catch (error) {
        console.error('Error fetching like counts:', error);
        // Continue with fetching individual like statuses even if counts fail
      } finally {
        clearTimeout(timeoutId);
      }
      
      // Get like statuses - but limit to 3 concurrent requests to avoid rate limiting
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < validProjectIds.length; i += batchSize) {
        batches.push(validProjectIds.slice(i, i + batchSize));
      }
      
      const newLikedProjects = { ...likedProjects };
      
      for (const batch of batches) {
        const likeStatusPromises = batch.map(async (projectId) => {
          try {
            const statusController = new AbortController();
            const statusTimeoutId = setTimeout(() => statusController.abort(), 5000); // 5 second timeout
            
            const statusResponse = await fetch(`${API_BASE_URL}/likes/${projectId}`, {
              ...defaultFetchOptions,
              headers: {
                ...defaultFetchOptions.headers,
                Authorization: `Bearer ${token}`
              } as HeadersInit,
              signal: statusController.signal
            });
            
            const statusData = await handleResponse<{ liked: boolean }>(statusResponse);
            clearTimeout(statusTimeoutId);
            return { projectId, liked: statusData.liked };
          } catch (error) {
            console.error(`Error fetching like status for project ${projectId}:`, error);
            return { projectId, liked: false };
          }
        });
        
        // Process each batch sequentially
        const batchResults = await Promise.allSettled(likeStatusPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            newLikedProjects[result.value.projectId] = result.value.liked;
          }
        });
        
        // Add a small delay between batches to avoid rate limiting
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Update liked projects state atomically
      setLikedProjects(newLikedProjects);
    } catch (error) {
      console.error('Error refreshing likes:', error);
    } finally {
      // Clear the pending flag for this refresh
      const cacheKey = projectIds.sort().join(',');
      pendingRefreshes.current[cacheKey] = false;
    }
  }, [user, getAuthToken, likedProjects]);

  const toggleLike = useCallback(async (projectId: string) => {
    if (!user) {
      toast.error("Please sign in to like projects");
      return;
    }
    
    // Validate project ID format
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      toast.error("Invalid project ID");
      return;
    }
    
    // Prevent multiple clicks by checking if already loading
    if (isLikeLoading[projectId]) {
      return;
    }
    
    // Optimistically update UI first
    const currentLiked = likedProjects[projectId] || false;
    const currentCount = likeCounts[projectId] || 0;
    
    // Optimistically update the UI
    setLikedProjects(prev => ({
      ...prev,
      [projectId]: !currentLiked
    }));
    
    setLikeCounts(prev => ({
      ...prev,
      [projectId]: !currentLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
    }));
    
    // Mark as loading
    setIsLikeLoading(prev => ({ ...prev, [projectId]: true }));
    
    try {
      const token = getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/likes/${projectId}`, {
        method: 'POST',
        ...defaultFetchOptions,
        headers: {
          ...defaultFetchOptions.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        } as HeadersInit,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await handleResponse<{ liked: boolean; likeCount: number }>(response);
      
      // Update with actual server data
      setLikedProjects(prev => ({
        ...prev,
        [projectId]: data.liked
      }));
      
      setLikeCounts(prev => ({
        ...prev,
        [projectId]: data.likeCount
      }));
      
      // Clear the cache for this project to force a refresh next time
      if ((window as any)._likeRefreshCache) {
        Object.keys((window as any)._likeRefreshCache).forEach(key => {
          if (key.includes(projectId)) {
            delete (window as any)._likeRefreshCache[key];
          }
        });
      }
      
      // Only show toast if the operation was successful
      toast.success(data.liked ? "Added to your liked projects" : "Removed from your liked projects");
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic updates on error
      setLikedProjects(prev => ({
        ...prev,
        [projectId]: currentLiked
      }));
      
      setLikeCounts(prev => ({
        ...prev,
        [projectId]: currentCount
      }));
      
      toast.error("Failed to update like status");
    } finally {
      setIsLikeLoading(prev => ({ ...prev, [projectId]: false }));
    }
  }, [user, getAuthToken, likedProjects, likeCounts, isLikeLoading]);

  return (
    <LikeContext.Provider value={{ 
      likedProjects, 
      likeCounts, 
      toggleLike, 
      refreshLikes,
      isLikeLoading
    }}>
      {children}
    </LikeContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikeContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikeProvider');
  }
  return context;
} 