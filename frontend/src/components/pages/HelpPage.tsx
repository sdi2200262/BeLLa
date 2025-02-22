import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { HelpCircle } from "lucide-react"

export function HelpPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Help Center</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using BeLLa <HelpCircle className="h-3 w-3" /> Support System
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Getting Started */}
          <Card className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
              Getting Started 🚀
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4 text-white/80">
              <div className="flex flex-col gap-2">
                  
                <span className=" text-white text-xl font-bold">1. Projects</span>
                <p className="text-white"> Projects are the main way to interact with the BeLLa platform.</p>
                <ul className="list-disc list-inside text-white">
                  <li>View BeLLa Projects, add comments and provide feedback.</li>
                  <li>Clone a project to your local machine and make it your own.</li>
                  <li>Publish your own projects to the BeLLa platform.</li>
                </ul>
                <Button variant="outline" className="bg-white/5 mt-4 w-fit text-white hover:text-white hover:bg-white/10 transition-colors duration-100" onClick={() => (window.location.href = "/projects")}>
                  <img src="/svg/general/Code.svg" alt="Terminal" className="size-6 mr-2" />
                  View Projects
                </Button>
              
                <div className="w-full h-[1px] bg-white/10 my-4"></div>

                <span className="text-white text-xl font-bold">2. Contribute</span>
                <p className="text-white">Contribute to BeLLa by forking the repository of a project and submitting a PR.</p>
                <p className="text-white">You can also contribute to BeLLa by publishing your own projects to the platform.</p>
                <Button variant="outline" className="bg-white/5 mt-4 w-fit text-white hover:text-white hover:bg-white/10 transition-colors duration-100" onClick={() => (window.location.href = "/contribute")}>
                  <img src="/svg/general/Code.svg" alt="Terminal" className="size-6 mr-2" />
                  View Contribute
                </Button>


              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Frequently Asked Questions 📝
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {[
                { question: "How to contribute?", answer: "Fork the repository and submit a PR" },
                { question: "Where are my projects stored?", answer: "Locally in your browser's storage" },
              ].map((faq, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-medium">{faq.question}</h3>
                  <p className="text-white/60 mt-2">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-black/50 border-white/10">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-xl text-white flex items-center gap-2">
                  <img src="/svg/general/Discord.svg" alt="Discord" className="size-8" />
                  Community Support
                </h3>
                
                <Button variant="default" className="w-full bg-[#5865F2] hover:bg-[#4752C4]">
                  Join Discord Server
                </Button>
              
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-white/10">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-xl text-white flex items-center gap-2">
                  <img src="/svg/general/@.svg" alt="Email" className="size-8" />
                  Email Support
                </h3>
                <Button variant="outline" className="w-full bg-white text-black hover:bg-white/80 transition-colors duration-100">
                  contact@bella.dev
                </Button>
              </CardContent>
            </Card>
          </div>
        
        </div>
      </div>
    </div>
  )
}
