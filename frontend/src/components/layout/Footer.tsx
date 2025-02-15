export function Footer() {
  return (
    <footer className="w-full bg-black/50 border-t border-white/10 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">

            <img src="/svg/BeLLa/BeLLa-Monogram.svg" alt="BeLLa Monogram" className="h-8 " />
           
          <div className="flex gap-8 text-white/60">

            <a href="https://github.com/sdi2200262/BeLLa" className="hover:text-white transition-colors">GitHub</a>
            
            <p> | </p>

            <a href="/License" className="hover:text-white transition-colors">License</a>
            
            <p> | </p>

            <a href="/docs" className="hover:text-white transition-colors">Docs</a>
          
          </div>
          
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} BeLLa. All rights reserved.
          </div>

        </div>
      </div>
    </footer>
  )
}
