export function Documentation() {

  return (
    <div className="Documentation-container">

      <div className="flex h-[64px] bg-black">
        <p className="text-white text-4xl font-bold p-4">Documentation</p>
        <p className="text-white text-4xl font-bold p-4 ml-[780px]">Viewer</p>
      </div>
      
      <div className="w-100vh h-[1px] bg-white/10"></div>
      <div className="fixed left-[400px] top-[64px] w-[1px] h-screen bg-white/10"></div>

      <div className="flex flex-1">
        
        <div className="w-[400px] p-4">
          <div className="text-white">
            File selector will go here
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="text-white">
            Markdown content will be displayed here
          </div>
        </div>
      
      </div>


    </div>
  );
}
