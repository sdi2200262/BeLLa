import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"

export function ServerStatus() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApiMessage = () => {
    setLoading(true)
    setError(null)
    setMessage('')
    fetch('http://localhost:5001/api')
      .then(res => res.json())
      .then(data => {
        setMessage(data.message)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to receive API endpoint message')
        setLoading(false)
      })
  }

  const buttonText = message || error ? "Refresh API endpoint message" : "Receive API endpoint message"

  return (
    <Card className="w-[350px] h-[250px] border-white/10 bg-black/50 backdrop-blur-sm">
      <CardHeader className="h-[100px]">
        <CardTitle className="text-white/90">Backend Connection</CardTitle>
        <CardDescription className="text-white/60">
          Test the connection to the backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between h-[100px]">
        <div className="h-[48px] flex items-center justify-center">
          {loading ? (
            <span className="text-lg leading-[48px]">Loading...</span>
          ) : message ? (
            <span className="text-lg text-blue-400 fade-in leading-[48px]">
              {message}
            </span>
          ) : error ? (
            <span className="text-lg text-red-400 leading-[48px]">{error}</span>
          ) : (
            <span className="text-lg opacity-0 leading-[48px]">placeholder</span>
          )}
        </div>
        <div className="flex gap-2 border-t border-white/10 pt-4 w-full justify-center">
          <Button 
            className="h-12 bg-white text-black hover:bg-white/90"
            onClick={fetchApiMessage}
            disabled={loading}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 