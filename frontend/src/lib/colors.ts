// GitHub language colors
const languageColors: { [key: string]: string } = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb",
  Swift: "#ffac45",
  Kotlin: "#f18e33",
  Scala: "#c22d40",
  Elixir: "#6b37bb",
  "Objective-C": "#438eff",
  Svelte: "#ff3e00"
};

export function getLanguageColor(language: string): string {
  return languageColors[language] || "#858585"; // Default color for unknown languages
} 