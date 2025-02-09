import { useState } from 'react'
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <Card className="w-[350px] h-[250px] border-white/10 bg-black/50 backdrop-blur-sm">
      <CardHeader className="h-[100px]">
        <CardTitle className="text-white/90">Counter Example</CardTitle>
        <CardDescription className="text-white/60">
          A simple counter using Shadcn UI components
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between h-[100px]">
        <div className="h-[48px] flex items-center justify-center">
          <div className="text-5xl font-light text-white">{count}</div>
        </div>
        <div className="flex gap-2 border-t border-white/10 pt-4 w-full justify-center">
          <Button 
            variant="outline"
            className="h-12 border-white/10 bg-black/50 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setCount(c => c - 1)}
          >
            Decrease
          </Button>
          <Button 
            className="h-12 bg-white text-black hover:bg-white/90"
            onClick={() => setCount(c => c + 1)}
          >
            Increase
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 