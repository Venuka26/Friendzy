import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useUser } from '@clerk/clerk-react'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null)
  const { user } = useUser()

  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_BASEURL, { autoConnect: false })
  }

  useEffect(() => {
    if (!user) return
    const socket = socketRef.current
    socket.connect()
    socket.emit('register', user.id)

    return () => {
      socket.disconnect()
    }
  }, [user])

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
