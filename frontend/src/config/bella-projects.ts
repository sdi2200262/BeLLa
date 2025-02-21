interface BellaProject {
  repositoryUrl: string;
  description?: string;  // Optional description to show in the UI
}

export const bellaProjects: BellaProject[] = [
  {
    repositoryUrl: "https://github.com/sdi2200262/BeLLa",
    description: "BeLLa Project Management Platform"
  },
  {
    repositoryUrl: "https://github.com/sdi2200262/BeLLa-NERT",
    description: "A Web App development template using Node.js, Express, React, and TypeScript"
  }
  // Add more BeLLa projects here as they are developed
]; 