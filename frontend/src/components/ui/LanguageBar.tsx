import { cn } from "@/lib/utils";

interface Language {
  name: string;
  percentage: number;
  color: string;
}

interface LanguageBarProps {
  languages: Language[];
  className?: string;
}

export function LanguageBar({ languages, className }: LanguageBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-2 rounded-full overflow-hidden">
        {languages.map((lang, index) => (
          <div
            key={index}
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/70">
        {languages.map((lang, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: lang.color }}
            />
            <span>{lang.name}</span>
            <span>{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 