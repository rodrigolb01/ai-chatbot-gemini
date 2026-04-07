import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import './App.css'
import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

const ai = new GoogleGenAI({ apiKey })

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async () => {
    const prompt = input.trim()
    if (!prompt || isLoading) return

    const userMessage: Message = { role: 'user', content: prompt }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text || 'No answer received. Try again.',
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI request failed', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Oops! Something went wrong. Please try again later.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div>
          <p className="eyebrow">Google Gemini Chat</p>
          <h1>Ask anything</h1>
          <p className="subtitle">Type a message and get a response from the AI.</p>
        </div>
      </header>

      <main className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>Start the conversation and your assistant will reply here.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-bubble">
              <span className="message-role">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <p>{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-bubble typing">
              <span className="message-role">Assistant</span>
              <p>Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className="input-area">
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here..."
          disabled={isLoading}
          rows={1}
        />
        <button
          className="send-button"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default App
