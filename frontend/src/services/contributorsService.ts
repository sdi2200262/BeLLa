import { API_BASE_URL } from '@/config/api';

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export const fetchContributors = async (): Promise<Contributor[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/contributors`);
    if (!response.ok) {
      throw new Error('Failed to fetch contributors');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return [];
  }
}; 