import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

export function LandingPage() {
  return (
    <div className="landing-container-vertical">
      
      <div className="landing-container-horizontal">
        
        <div className="BeLLa-section">
          <div className="content-center flex-1">
            
            <img src="/svg/BeLLa/BeLLa-Logo.svg" alt="BeLLa Logo" className="bella-logo" />

            <p className="text-3xl"> Open source development tools and SaaS.</p>
            
            <a href="https://github.com/sdi2200262/BeLLa"> <img src= "/svg/github/Github-Icon.svg" alt="Github Icon" className="github-icon hover:scale-105 transition-all duration-300"/></a>
            
            <div className="button-container">
              <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-black px-8 py-4 text-xl hover:scale-105 transition-all duration-300">See Projects</Button>
              <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-white text-black px-8 py-4 text-xl hover:scale-105 transition-all duration-300 hover:bg-white">Learn More</Button>
            </div>

            <div className="CobuterMan-container ">
              <img src="/svg/BeLLa/CobuterMan.svg" alt="CobuterMan" />
            </div>
          
          </div>
        </div>

        <div className="Product-section">
          <div className="content-center">
            
            <img src="/svg/BeLLa/BeLLa-NERT.svg" alt="Product Logo" className="product-logo" />

            <p className="text-3xl text-center"> Build Web Apps in minutes with a full-stack template. <br /> One command setup. Easy to scale.</p>

            <img src="/svg/general/Browser-Screenshot.svg" alt="Product Image" className="product-image hover:scale-105 transition-all duration-300" />
            
            <div className="button-container">
                <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-[#0066FF] px-8 py-4 text-xl hover:bg-[#0066FF] hover:scale-105 transition-all duration-300">View on Github <img src="/svg/github/Git-Branch.svg" alt="Github Icon" className="size-8 pl-2"/></Button>
                <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-white text-black px-8 py-4 text-xl hover:scale-105 transition-all duration-300 hover:bg-white">Get Started <img src="/svg/general/Codesandbox.svg" alt="Codesandbox Icon" className="size-8 pl-2"/></Button>
            </div>
          
          </div>
        </div>
      
      </div>

      <div className="w-full h-[1px] bg-white/10 "></div>
    
      <div id="team-section" className="Team-section">
        <div className="content-center">
          
          <h2 className="text-5xl font-bold text-white">Team</h2>
          <img src="/svg/general/Team.svg" alt="Team" className="team-image size-25" />
          <div className="w-[300px] h-[1px] bg-white/10 mt-8"></div>
          
          <div className="grid gap-6 mt-8 ">
            <Card className="rounded-[15px] bg-black/50 border-white/10 backdrop-blur-md hover:scale-105 transition-all duration-300">
              
              <CardHeader className="flex flex-row gap-4 items-center">

                
                <div>
                  <CardTitle className="text-white">CobuterMan</CardTitle>
                  <CardDescription className="text-white/70">CS Undergraduate, Junior Developer</CardDescription>
                </div>
                
                <img src="https://github.com/sdi2200262.png" alt="Developer Avatar" className="size-16 rounded-full ml-auto" />
              
              </CardHeader>
              
              <CardContent className="pt-6">
                
                <p className="text-white/80 text-center">"It's very tiring carrying the whole team on my shoulders."</p>
                
                <div className="flex gap-4 mt-4">
                  
                  <a href="https://github.com/sdi2200262" className="hover:scale-105 transition-all"> <img src="/svg/github/Github-Icon.svg" alt="Github" className="size-6" /> </a>
                  
                  <a href="https://www.linkedin.com/in/sdi2200262/" className="hover:scale-105 transition-all"> <img src="/svg/general/Linkedin.svg" alt="Linkedin" className="size-6" /> </a>

                  <a href="https://discord.com/users/1234567890" className="hover:scale-105 transition-all"> <img src="/svg/general/Discord.svg" alt="Discord" className="size-7" /> </a>
                
                  <a href="" className="hover:scale-105 transition-all"> <img src="/svg/general/@.svg" alt="Email" className="size-7" /> </a>

                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-white/80 text-center mt-40"> Interested in joining?</p>
          <a href="" className="text-white/80 text-center hover:scale-105 transition-all"> Contact Us (Me)</a>

        </div>
      </div>

      <div className="w-full h-[1px] bg-white/10 "></div>

      <div id="github-contributors-section" className="Github-contributors-section">
        <div className="content-center">

          <h2 className="text-5xl font-bold text-white">Github Contributors</h2>
          <img src="/svg/general/Git-Pull-Request.svg" alt="Github Contributors" className="github-contributors-image size-14" />
          <div className="w-[300px] h-[1px] bg-white/10 "></div>

          <div className="grid mt-8">
            
            <a href="https://github.com/sdi2200262" className="flex hover:scale-105 transition-all duration-300"> <img src="https://github.com/sdi2200262.png" alt="sdi2200262" className="size-20 rounded-full" /> </a>
          
          </div>

          <div className="flex gap-2 mt-40 text-white/80 text-center">
            <p className="text-lg"> You can join Github Contributors by </p>
            <a href="/contribute" className="text-lg font-bold hover:scale-105 transition-all">contributing</a>
            <p className="text-lg"> to the project.</p>
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
