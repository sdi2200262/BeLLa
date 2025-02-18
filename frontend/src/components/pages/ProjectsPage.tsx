import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { SearchBar } from "../ui/searchbar"
import { cn } from "@/lib/utils"

export function ProjectsPage() {
  const [bellaSectionOpen, setBellaSectionOpen] = useState(true)
  const [userSectionOpen, setUserSectionOpen] = useState(true)

  return (
    <div className="h-full w-full bg-black">
      
      {/* Sticky header containing the search bar */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto max-w-7xl  p-4">
          <SearchBar 
            placeholder="Search projects..." 
            className={cn(
              "text-lg text-black rounded-full hover:scale-[1.02] focus:scale-[1.02] transition-all duration-300 ease-out hover:shadow-lg focus:shadow-lg w-full outline-none h-14 border-0",
              "focus:ring-0 focus:ring-offset-0 focus:ring-primary"
            )}
          /> 
        </div>
      </header>

      {/* Main content */}
      <div className="p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* BeLLa Projects Section */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setBellaSectionOpen(!bellaSectionOpen)}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">BeLLa Projects</h2>
                  <img
                    src="/svg/general/Triangle.svg"
                    alt="Toggle"
                    className={`size-3 transition-transform ${
                      bellaSectionOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>
                <Button variant="default" className=" bg-black text-white hover:text-white hover:bg-white/5">
                  <img
                    src="/svg/general/Add_Circle.svg"
                    alt="Add"
                    className="size-5 mr-2"
                  />
                  New Project
                </Button>
              </div>
              <div className="h-[1px] bg-white/10" />
            </div>

            {bellaSectionOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Card 1 */}
                <Card className="bg-black/50 border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Project 1</h3>
                    <p className="text-white/60">
                      Project description goes here
                    </p>
                  </CardContent>
                </Card>

                {/* Project Card 2 */}
                <Card className="bg-black/50 border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Project 2</h3>
                    <p className="text-white/60">
                      Project description goes here
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* User Projects Section */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setUserSectionOpen(!userSectionOpen)}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">User Projects</h2>
                  <img
                    src="/svg/general/Triangle.svg"
                    alt="Toggle"
                    className={`size-3 transition-transform ${
                      userSectionOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>
                <Button variant="default" className="bg-black text-white hover:text-white hover:bg-white/5">
                  <img
                    src="/svg/general/Add_Circle.svg"
                    alt="Add"
                    className="size-5 mr-2"
                  />
                  New Project
                </Button>
              </div>
              <div className="h-[1px] bg-white/10" />
            </div>

            {userSectionOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Card 1 */}
                <Card className="bg-black/50 border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Project 1</h3>
                    <p className="text-white/60">
                      Project description goes here
                    </p>
                  </CardContent>
                </Card>

                {/* Project Card 2 */}
                <Card className="bg-black/50 border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Project 2</h3>
                    <p className="text-white/60">
                      Project description goes here
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
