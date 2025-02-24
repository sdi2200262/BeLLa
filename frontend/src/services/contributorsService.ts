import { API_BASE_URL, defaultFetchOptions, handleResponse } from '@/config/api';
import { bellaProjects } from '@/config/bella-projects';

export interface Contributor {
  username: string;
  contributions: number;
  avatar: string;
}

export interface ContributorsResponse {
  contributors: Contributor[];
  cached: boolean;
  cacheExpiry?: number;
  limits?: {
    maxContributors: number;
    cacheTime: number;
  };
}

/**
 * Fetch and aggregate contributors from all BeLLa projects
 */
export const fetchContributors = async (): Promise<Contributor[]> => {
  try {
    // Fetch contributors for all BeLLa projects
    const contributorsMap = new Map<string, Contributor>();

    await Promise.all(
      bellaProjects.map(async (project) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/contributors?url=${encodeURIComponent(project.repositoryUrl)}`,
            {
              ...defaultFetchOptions,
              signal: AbortSignal.timeout(60000) // 60 second timeout
            }
          );
          
          const data = await handleResponse<ContributorsResponse>(response);
          
          // Aggregate contributions for each user
          data.contributors.forEach((contributor) => {
            if (contributorsMap.has(contributor.username)) {
              const existing = contributorsMap.get(contributor.username)!;
              existing.contributions += contributor.contributions;
            } else {
              contributorsMap.set(contributor.username, { ...contributor });
            }
          });
        } catch (error) {
          console.error(`Error fetching contributors for ${project.repositoryUrl}:`, error);
        }
      })
    );

    // Convert map to array and sort by total contributions
    return Array.from(contributorsMap.values())
      .sort((a, b) => b.contributions - a.contributions);
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return [];
  }
}; 