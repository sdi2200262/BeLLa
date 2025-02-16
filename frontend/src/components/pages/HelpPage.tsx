import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

export function HelpPage() {
  return (
    <div className="h-full w-full bg-black p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold text-white">Help Center</h1>
        
        {/* Getting Started */}
        <Card className="bg-black/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
            Getting Started 🚀
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 text-white/80">
            <div className="flex flex-col gap-2">
                
              <span className="text-xl font-bold">1. Projects</span>
              <p> Projects are the main way to interact with the BeLLa platform.</p>
              <ul className="list-disc list-inside">
                <li>View BeLLa Projects, add comments and provide feedback.</li>
                <li>Clone a project to your local machine and make it your own.</li>
                <li>Publish your own projects to the BeLLa platform.</li>
              </ul>
              <Button variant="outline" className="mt-4 w-fit hover:bg-white/5 transition-colors duration-100" onClick={() => (window.location.href = "/projects")}>
                <img src="/svg/general/Code.svg" alt="Terminal" className="size-6 mr-2" />
                View Projects
              </Button>
            
              <div className="w-full h-[1px] bg-white/10 my-4"></div>

              <span className="text-xl font-bold">2. Contribute</span>
              <p>Contribute to BeLLa by forking the repository of a project and submitting a PR.</p>
              <p>You can also contribute to BeLLa by publishing your own projects to the platform.</p>
              <Button variant="outline" className="mt-4 w-fit hover:bg-white/5 transition-colors duration-100" onClick={() => (window.location.href = "/contribute")}>
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
              <Button variant="outline" className="w-full hover:bg-white/5 transition-colors duration-100">
                contact@bella.dev
              </Button>
            </CardContent>
          </Card>
        </div>
      
      </div>
    </div>
  )
}
