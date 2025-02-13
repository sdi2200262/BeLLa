import { Button } from "../ui/button";

export function LandingPage() {
  return (
    <div className="landing-container">
      <div className="BeLLa-section">
        <div className="content-center">
          
          <img src="public/svg/BeLLa/BeLLa-Logo.svg" alt="BeLLa Logo" className="bella-logo" />

          <p className="text-3xl"> Open source development tools and SaaS.</p>
          
          <a href="https://github.com/sdi2200262/BeLLa"> <img src= "public/svg/github/Github-Icon.svg" alt="Github Icon" className="github-icon hover:scale-105 transition-all duration-300"/></a>
          
          <div className="button-container">
            <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-black px-8 py-4 text-xl hover:scale-105 transition-all duration-300">See Projects</Button>
            <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-white text-black px-8 py-4 text-xl hover:scale-105 transition-all duration-300 hover:bg-white">Learn More</Button>
          </div>

          <div className="CobuterMan"> 
              <img src="public/svg/BeLLa/CobuterMan.svg" alt="CobuterMan" />
          </div>
        
        </div>
      </div>


      <div className="Product-section">
        <div className="content-center">
            
            <img src="public/svg/BeLLa/BeLLa-NERT.svg" alt="Product Logo" className="product-logo" />

            <p className="text-3xl text-center"> Build Web Apps in minutes with a full-stack template. <br /> One command setup. Easy to scale.</p>

            <img src="public/svg/general/Browser-Screenshot.svg" alt="Product Image" className="product-image hover:scale-105 transition-all duration-300" />
            
            <div className="button-container">
                <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-[#0066FF] px-8 py-4 text-xl hover:bg-[#0066FF] hover:scale-105 transition-all duration-300">View on Github <img src="public/svg/github/Git-Branch.svg" alt="Github Icon" className="size-8 pl-2"/></Button>
                <Button variant="default" size="lg" className="rounded-[55px] border border-white bg-white text-black px-8 py-4 text-xl hover:scale-105 transition-all duration-300 hover:bg-white">Get Started <img src="public/svg/general/Codesandbox.svg" alt="Codesandbox Icon" className="size-8 pl-2"/></Button>
            </div>
        </div>
      </div>
    </div>
  );
}
