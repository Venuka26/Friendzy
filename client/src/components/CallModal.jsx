import { useEffect, useRef, useState } from 'react'
import { PhoneOff, MicOff, Mic } from 'lucide-react'
import { useSocket } from '../context/SocketContext'

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

/**
 * Props:
 *  user          - the remote user object { _id, full_name, profile_picture }
 *  onClose       - called when call ends
 *  isIncoming    - true if this side is the callee
 *  remoteOffer   - the SDP offer (only when isIncoming=true)
 *  callerId      - userId of the caller (only when isIncoming=true)
 *  currentUser   - logged-in user { full_name, profile_picture } for sending caller info
 */
const CallModal = ({ user, onClose, isIncoming = false, remoteOffer = null, callerId = null, currentUser = null }) => {
  const socket = useSocket()
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)

  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState(isIncoming ? 'connecting' : 'calling')
  const [muted, setMuted] = useState(false)

  // Timer once connected
  useEffect(() => {
    if (status !== 'connected') return
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [status])

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const endCall = () => {
    socket.emit('call-ended', { to: user._id })
    cleanup()
  }

  const cleanup = () => {
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  const toggleMute = () => {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMuted(m => !m)
  }

  useEffect(() => {
    let pc

    const start = async () => {
      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // When we get remote audio
      pc.ontrack = (e) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0]
        }
        setStatus('connected')
      }

      // Send ICE candidates to remote peer
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: user._id, candidate: e.candidate })
        }
      }

      if (isIncoming) {
        // Callee: set remote offer, create answer
        await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('call-accepted', { to: callerId, answer })
      } else {
        // Caller: create offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('call-user', {
          to: user._id,
          offer,
          callerName: currentUser?.full_name || '',
          callerPhoto: currentUser?.profile_picture || ''
        })
      }
    }

    start().catch(err => {
      console.error('Call setup failed', err)
      cleanup()
    })

    // Socket listeners
    const onAccepted = async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const onIceCandidate = async ({ candidate }) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (e) { /* ignore */ }
    }

    const onCallEnded = () => cleanup()
    const onCallRejected = () => cleanup()

    socket.on('call-accepted', onAccepted)
    socket.on('ice-candidate', onIceCandidate)
    socket.on('call-ended', onCallEnded)
    socket.on('call-rejected', onCallRejected)

    return () => {
      socket.off('call-accepted', onAccepted)
      socket.off('ice-candidate', onIceCandidate)
      socket.off('call-ended', onCallEnded)
      socket.off('call-rejected', onCallRejected)
    }
  }, [])

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay />

      <div className='bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-72'>
        <img
          src={user.profile_picture || 'https://via.placeholder.com/80'}
          alt={user.full_name}
          className='w-20 h-20 rounded-full object-cover ring-4 ring-green-200'
        />
        <p className='text-lg font-semibold text-slate-800'>{user.full_name}</p>
        <p className='text-sm text-slate-500'>
          {status === 'calling' && 'Calling...'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && formatTime(seconds)}
        </p>

        <div className='flex gap-4 mt-2'>
          <button
            onClick={toggleMute}
            className='p-3 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition cursor-pointer text-slate-700'
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff className='w-5 h-5' /> : <Mic className='w-5 h-5' />}
          </button>
          <button
            onClick={endCall}
            className='bg-red-500 hover:bg-red-600 active:scale-95 transition text-white p-4 rounded-full cursor-pointer'
            title="End call"
          >
            <PhoneOff className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallModal
