import { Counter } from "./components/Counter"
import { ServerStatus } from "./components/ServerStatus"
import "./index.css"
import { useState } from "react"

function App() {
  const [showTechStack, setShowTechStack] = useState(false);

  const techStackItems = [
    { 
      name: 'Node.js', 
      icon: '/icons/Nodejs.svg',
      url: 'https://nodejs.org/' 
    },
    { 
      name: 'Express', 
      icon: '/icons/Express.svg',
      url: 'https://expressjs.com/' 
    },
    { 
      name: 'MongoDB', 
      icon: '/icons/MongoDB.svg',
      url: 'https://www.mongodb.com/' 
    },
    { 
      name: 'Mongoose', 
      icon: '/icons/Mongoose.svg',
      url: 'https://mongoosejs.com/' 
    },
    { 
      name: 'React', 
      icon: '/icons/React.svg',
      url: 'https://react.dev/' 
    },
    { 
      name: 'TypeScript', 
      icon: '/icons/TypeScript.svg',
      url: 'https://www.typescriptlang.org/' 
    },
    { 
      name: 'Tailwind', 
      icon: '/icons/Tailwind.svg',
      url: 'https://tailwindcss.com/' 
    },
    { 
      name: 'Vite', 
      icon: '/icons/Vite.svg',
      url: 'https://vitejs.dev/' 
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <main className="page">
        <div className="space-y-10 text-center">
          
          {/* BeLLa logo */}
          <a 
            href="https://example.com/" 
            className="BeLLa-Logo"
          >
            BeLLa
            <div className="text-white/50 text-lg">Better Large Language</div>
          </a>
          <div className="white-line-separator fade-in" />
          <p className="subtitle mx-auto max-w-[600px] fade-in">
            An open-source full-stack web application template using <br />
            Node.js, Express, React, TypeScript and more...
          </p>          
          

          <div className="flex flex-col items-center fade-in">
            <button 
              onClick={() => setShowTechStack(!showTechStack)}
              className="px-4 py-2 text-white/60 hover:text-white/90 transition-colors"
            >
              {showTechStack ? 'Hide stack' : 'View stack' } 
            </button>
            
            <div className={`tech-stack-grid ${showTechStack ? 'tech-stack-grid-enter' : 'tech-stack-grid-exit'}`}>
              {techStackItems.map((tech) => (
                <div key={tech.name} className="tech-icon-container">
                  <a 
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full flex items-center justify-center"
                  >
                    <img 
                      src={tech.icon} 
                      alt={tech.name}
                      className="tech-icon"
                      title={`Visit ${tech.name} website`}
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="fade-in">
              <ServerStatus />
            </div>
            <div className="fade-in">
              <Counter />
            </div>
          </div>
          <p className="text-white/60 text-sm fade-in">
            View backend status at:{' '}
            <a 
              href="http://localhost:5001" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/90 hover:text-white/60 fade-in"
            >
              http://localhost:5001
            </a>
          </p>
              
          {/* BeLLa Logo Icon*/}    
          <div className="BeLLa-Logo flex justify-center fade-in">
            <a
              href="https://example.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img 
                src="/favicon_large.png" 
                alt="Logo" 
                className="w-16 h-16 opacity-60 hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}

export default App 