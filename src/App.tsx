import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import './App.css'
import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

const ai = new GoogleGenAI({ apiKey })

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Main application component for the Google Gemini AI chatbot.
 * Provides a chat interface where users can send messages and receive AI responses.
 * Persists conversation history to browser localStorage for session continuity.
 */
function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const STORAGE_KEY = 'chatbot_messages'

  /**
   * Loads conversation history from browser localStorage on component mount.
   * This allows users to resume their conversation after page refresh.
   */
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (error) {
        console.error('Failed to load messages from storage', error)
      }
    }
  }, [])

  /**
   * Saves all messages to browser localStorage whenever the messages state changes.
   * This persists the conversation history across browser sessions.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  /**
   * Automatically scrolls to the bottom of the messages container
   * whenever new messages are added or loading state changes.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  /**
   * Sends the user's input message to the Google Gemini AI model
   * and handles the response by updating the messages state.
   * Includes full conversation history so the AI can provide contextual responses.
   * Manages loading state and error handling.
   */
  const sendMessage = async () => {
    const prompt = input.trim()
    if (!prompt || isLoading) return

    const userMessage: Message = { role: 'user', content: prompt }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Send full conversation history for better context-aware responses
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: updatedMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
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

  /**
   * Clears all chat messages and resets the conversation.
   * Removes all data from browser localStorage.
   */
  const clearChat = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Handles keyboard events in the input textarea.
   * Sends the message when Enter is pressed without Shift modifier.
   * @param event - The keyboard event from the textarea
   */
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
        <button
          className="clear-button"
          onClick={clearChat}
          title="Clear conversation history"
        >
          Clear Chat
        </button>
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
