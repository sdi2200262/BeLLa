import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useState } from "react";
import { fetchContributors, type Contributor } from "@/services/contributorsService";

export function LandingPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContributors = async () => {
      const data = await fetchContributors();
      setContributors(data);
      setIsLoading(false);
    };

    loadContributors();
  }, []);

  return (
    <div className="landing-container-vertical">
      <div className="landing-container-horizontal">
        <div className="BeLLa-section">
          <div className="content-center flex-1">
            <img 
              src="/svg/BeLLa/BeLLa-Logo.svg" 
              alt="BeLLa Logo" 
              className="bella-logo transition-all duration-300" 
            />

            <p className="text-white text-center text-3xl">
              Open source development tools and SaaS.
            </p>
            
            <a 
              href="https://github.com/sdi2200262/BeLLa" 
              className="block transition-all duration-300"
            >
              <img 
                src="/svg/github/Github-Icon.svg" 
                alt="Github Icon" 
                className="github-icon mx-auto hover:scale-110 duration-300" 
              />
            </a>
            
            <div className="button-container">
              <Button 
                variant="default" 
                size="lg" 
                className="rounded-[55px] border border-white bg-black px-8 py-4 text-xl transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = '/projects'}
              >
                See Projects
              </Button>
              <Button 
                variant="default" 
                size="lg" 
                className="rounded-[55px] border border-white bg-white text-black px-8 py-4 text-xl transition-all duration-300 hover:scale-105 hover:bg-white"
                onClick={() => window.location.href = '/documentation'}
              >
                Learn More
              </Button>
            </div>

            <div className="CobuterMan-container">
              <img 
                src="/svg/BeLLa/CobuterMan.svg" 
                alt="CobuterMan" 
                className="transition-all duration-300" 
              />
            </div>
          </div>
        </div>

        <div className="Product-section bg-gray">
          <div className="content-center">
            <img 
              src="/svg/BeLLa/BeLLa-NERT.svg" 
              alt="Product Logo" 
              className="product-logo transition-all duration-300" 
            />

            <p className="text-white text-3xl text-center">
              Build Web Apps in minutes with a full-stack template. <br /> 
              One command setup. Easy to scale.
            </p>

            <img 
              src="/svg/general/Browser-Screenshot.svg" 
              alt="Product Image" 
              className="product-image transition-all duration-300 hover:scale-105" 
            />
            
            <div className="button-container">
              <Button 
                variant="default" 
                size="lg" 
                className="rounded-[55px] border border-white bg-[#0066FF] px-8 py-4 text-xl transition-all duration-300 hover:scale-105 hover:bg-[#0066FF] group"
                onClick={() => window.location.href = 'https://github.com/sdi2200262/BeLLa-NERT'}
              >
                View on Github 
                <img 
                  src="/svg/github/Git-Branch.svg" 
                  alt="Github Icon" 
                  className="size-8 pl-2"
                />
              </Button>
              <Button 
                variant="default" 
                size="lg" 
                className="rounded-[55px] border border-white bg-white text-black px-8 py-4 text-xl transition-all duration-300 hover:scale-105 hover:bg-white group"
                onClick={() => window.location.href = '/documentation'}
              >
                Get Started 
                <img 
                  src="/svg/general/Codesandbox.svg" 
                  alt="Codesandbox Icon" 
                  className="size-8 pl-2"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/10"></div>

      <div id="team-section" className="Team-section">
        <div className="content-center">
          <h2 className="text-5xl font-bold text-white">Team</h2>
          <img 
            src="/svg/general/Team.svg" 
            alt="Team" 
            className="team-image size-25 transition-all duration-300 hover:scale-105" 
          />
          <div className="w-[300px] h-[1px] bg-white/10 mt-8"></div>
          
          <div className="grid gap-6 mt-8">
            <Card className="rounded-[15px] bg-black/50 border-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row gap-4 items-center">
                <div>
                  <CardTitle className="text-white">CobuterMan</CardTitle>
                  <CardDescription className="text-white/70">CS Undergraduate, Junior Developer</CardDescription>
                </div>
                <img 
                  src="https://github.com/sdi2200262.png" 
                  alt="Developer Avatar" 
                  className="size-16 rounded-full ml-auto transition-transform hover:scale-110" 
                />
              </CardHeader>
              
              <CardContent className="pt-6">
                <p className="text-white/80 text-center">"It's very tiring carrying the whole team on my shoulders."</p>
                
                <div className="flex gap-4 mt-4 justify-center">
                  <a href="https://github.com/sdi2200262" className="transition-transform hover:scale-125"> 
                    <img src="/svg/github/Github-Icon.svg" alt="Github" className="size-6" /> 
                  </a>
                  <a href="https://www.linkedin.com/in/sdi2200262/" className="transition-transform hover:scale-125"> 
                    <img src="/svg/general/Linkedin.svg" alt="Linkedin" className="size-6" /> 
                  </a>
                  <a href="https://discord.com/users/1234567890" className="transition-transform hover:scale-125"> 
                    <img src="/svg/general/Discord.svg" alt="Discord" className="size-7" /> 
                  </a>
                  <a href="mailto:contact@bella.dev" className="transition-transform hover:scale-125"> 
                    <img src="/svg/general/@.svg" alt="Email" className="size-7" /> 
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-white/80 text-center mt-40">Interested in joining?</p>
          <a href="mailto:contact@bella.dev" className="text-white/80 text-center block hover:scale-105 transition-all duration-300 hover:text-white"> 
            Contact Us (Me)
          </a>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/10"></div>

      <div id="github-contributors-section" className="Github-contributors-section">
        <div className="content-center">
          <h2 className="text-5xl font-bold text-white">Github Contributors</h2>
          <img src="/svg/general/Git-Pull-Request.svg" alt="Github Contributors" className="github-contributors-image size-14" />
          <div className="w-[300px] h-[1px] bg-white/10"></div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
            {isLoading ? (
              <div className="col-span-full flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : contributors.length > 0 ? (
              contributors.map((contributor) => (
                <a
                  key={contributor.login}
                  href={contributor.html_url}
                  className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={contributor.avatar_url}
                    alt={`${contributor.login}'s avatar`}
                    className="size-20 rounded-full ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-300"
                  />
                  <span className="text-white/70 text-sm group-hover:text-white transition-colors duration-300">
                    {contributor.login}
                  </span>
                  <span className="text-white/50 text-xs">
                    {contributor.contributions} contributions
                  </span>
                </a>
              ))
            ) : (
              <div className="col-span-full text-center text-white/70">
                No contributors found
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-40 text-white/80 text-center">
            <p className="text-lg">You can join Github Contributors by contributing</p>
            <a href="/projects" className="text-lg font-bold hover:scale-105 transition-all">
              to a project.
            </a>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/10 "></div>

      <div id="blog-section" className="Blog-section">
        <div className="content-center">
          
          <h2 className="text-5xl font-bold text-white">Blog</h2>
          <img src="/svg/general/Blog.svg" alt="Blog" className="blog-image size-12" />
          <div className="w-[300px] h-[1px] bg-white/10 "></div>

          <div className="mt-8 max-w-2xl">

            <Card className="bg-black/40 border-white/10">
              
              
              <CardHeader>
                
                <div className="flex justify-center mb-4">
                  <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa-Monogram" className="blog-image size-22" />
                </div>
                
                <CardTitle className="text-white text-2xl">Welcome to BeLLa</CardTitle>
                
                <CardDescription className="text-white/60">Posted on February 15, 2025</CardDescription>
              
              </CardHeader>
              
              <CardContent>
                <p className="text-white/80">
                  A quick introduction to BeLLa, a platform for developing open source tools and SaaS. 
                </p>
              </CardContent>
              
              <CardFooter>
                <div className="flex items-center gap-2">
                  <img src="/svg/general/Book.svg" alt="Read" className="size-5" />
                  <a href="#" className="text-white/60 hover:text-white transition-colors">Read More</a>
                </div>
              </CardFooter>
            
            </Card>

          </div>

          <div className="flex justify-center mt-40">
          <div className="text-white/60">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric', 
              month: 'long',
              day: 'numeric'
            })}
          </div>
          </div>

        </div>
      </div>
    
    </div>
  );
}
