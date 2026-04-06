import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'
import { useSocket } from '../context/SocketContext'
import { useEffect } from 'react'
import IncomingCallModal from '../components/IncomingCallModal'
import CallModal from '../components/CallModal'

const Layout = () => {
    const user = useSelector((state) => state.user.value)
    const socket = useSocket()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [incomingCall, setIncomingCall] = useState(null)   // { from, offer, callerName, callerPhoto }
    const [activeCall, setActiveCall] = useState(null)       // { user, isIncoming, remoteOffer, callerId }

    useEffect(() => {
        if (!socket) return

        const onIncoming = ({ from, offer, callerName, callerPhoto }) => {
            setIncomingCall({ from, offer, callerName, callerPhoto })
        }

        socket.on('call-incoming', onIncoming)
        return () => socket.off('call-incoming', onIncoming)
    }, [socket])

    const handleAccept = () => {
        if (!incomingCall) return
        setActiveCall({
            user: {
                _id: incomingCall.from,
                full_name: incomingCall.callerName,
                profile_picture: incomingCall.callerPhoto,
            },
            isIncoming: true,
            remoteOffer: incomingCall.offer,
            callerId: incomingCall.from,
        })
        setIncomingCall(null)
    }

    const handleReject = () => {
        if (!incomingCall) return
        socket.emit('call-rejected', { to: incomingCall.from })
        setIncomingCall(null)
    }

  return user ? (
    <div className='w-full flex h-screen'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
        <div className='flex-1 bg-slate-50'>
            <Outlet />
        </div>
        {sidebarOpen
            ? <X className='absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden' onClick={() => setSidebarOpen(false)}/>
            : <Menu className='absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden' onClick={() => setSidebarOpen(true)}/>
        }

        {incomingCall && !activeCall && (
            <IncomingCallModal
                callerName={incomingCall.callerName}
                callerPhoto={incomingCall.callerPhoto}
                onAccept={handleAccept}
                onReject={handleReject}
            />
        )}

        {activeCall && (
            <CallModal
                user={activeCall.user}
                isIncoming={activeCall.isIncoming}
                remoteOffer={activeCall.remoteOffer}
                callerId={activeCall.callerId}
                onClose={() => setActiveCall(null)}
            />
        )}
    </div>
  ) : (
    <Loading />
  )
}

export default Layout
