import { Phone, PhoneOff } from 'lucide-react'

const IncomingCallModal = ({ callerName, callerPhoto, onAccept, onReject }) => {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-72'>
        <img
          src={callerPhoto || 'https://via.placeholder.com/80'}
          alt={callerName}
          className='w-20 h-20 rounded-full object-cover ring-4 ring-green-200 animate-pulse'
        />
        <p className='text-lg font-semibold text-slate-800'>{callerName}</p>
        <p className='text-sm text-slate-500'>Incoming call...</p>

        <div className='flex gap-6 mt-2'>
          <button
            onClick={onReject}
            className='bg-red-500 hover:bg-red-600 active:scale-95 transition text-white p-4 rounded-full cursor-pointer'
            title="Decline"
          >
            <PhoneOff className='w-5 h-5' />
          </button>
          <button
            onClick={onAccept}
            className='bg-green-500 hover:bg-green-600 active:scale-95 transition text-white p-4 rounded-full cursor-pointer'
            title="Accept"
          >
            <Phone className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal
