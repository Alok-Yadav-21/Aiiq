'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

let globalSocket: Socket | null = null

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(WS_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
      })
    }

    socketRef.current = globalSocket

    return () => {
      // Keep connection alive across components
    }
  }, [token])

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }, [])

  return { socket: socketRef.current, emit, on }
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect()
    globalSocket = null
  }
}
