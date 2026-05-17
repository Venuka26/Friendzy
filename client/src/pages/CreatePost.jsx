import React, { useState } from 'react'
import { Image, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

const TONES = [
  { value: 'professional', label: '💼 Professional' },
  { value: 'casual',       label: '😊 Casual'       },
  { value: 'funny',        label: '😂 Funny'         },
]

const CreatePost = () => {
  const navigate = useNavigate()
  const [content, setContent]     = useState('')
  const [images, setImages]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [tone, setTone]           = useState('professional')
  const [enhancing, setEnhancing] = useState(false)

  const user = useSelector((state) => state.user.value)
  const { getToken } = useAuth()

  const handleEnhance = async () => {
    if (!content.trim()) return toast.error('Write something first')
    setEnhancing(true)
    try {
      const token = await getToken()
      const { data } = await api.post(
        '/api/post/enhance',
        { content, tone },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setContent(data.enhanced)
        toast.success('Post enhanced!')
      } else {
        toast.error(data.message || 'Enhancement failed')
      }
    } catch (err) {
      toast.error('Enhancement failed')
    } finally {
      setEnhancing(false)
    }
  }

  const handleSubmit = async () => {
    if (!images.length && !content) {
      return toast.error('Please add at least one image or text')
    }
    setLoading(true)

    const postType = images.length && content ? 'text_with_image' : images.length ? 'image' : 'text'

    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('post_type', postType)
      images.forEach((image) => formData.append('images', image))

      const { data } = await api.post('/api/post/add', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        navigate('/')
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      throw new Error(error.message)
    }
    setLoading(false)
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Create Post</h1>
          <p className='text-slate-600'>Share your thoughts with the world</p>
        </div>

        {/* Form */}
        <div className='max-w-xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4'>
          {/* Header */}
          <div className='flex items-center gap-3'>
            <img src={user.profile_picture} alt="" className='w-12 h-12 rounded-full shadow'/>
            <div>
              <h2 className='font-semibold'>{user.full_name}</h2>
              <p className='text-sm text-gray-500'>@{user.username}</p>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            className='w-full resize-none max-h-40 mt-4 text-sm outline-none placeholder-gray-400'
            placeholder="What's happening?"
            rows={4}
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          {/* AI Enhance Bar */}
          <div className='flex items-center gap-2 flex-wrap'>
            {/* Tone selector */}
            <div className='flex gap-1'>
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer
                    ${tone === t.value
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Enhance button */}
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              className='ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 active:scale-95 transition text-white font-medium cursor-pointer disabled:opacity-60'
            >
              <Sparkles className='w-3.5 h-3.5' />
              {enhancing ? 'Enhancing...' : 'Enhance with AI'}
            </button>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-4'>
              {images.map((image, i) => (
                <div key={i} className='relative group'>
                  <img src={URL.createObjectURL(image)} className='h-20 rounded-md' alt="" />
                  <div
                    onClick={() => setImages(images.filter((_, index) => index !== i))}
                    className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'
                  >
                    <X className="w-6 h-6 text-white"/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className='flex items-center justify-between pt-3 border-t border-gray-300'>
            <label htmlFor="images" className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer'>
              <Image className='size-6'/>
            </label>
            <input type="file" id="images" accept='image/*' hidden multiple onChange={(e) => setImages([...images, ...e.target.files])}/>

            <button
              disabled={loading}
              onClick={() => toast.promise(handleSubmit(), {
                loading: 'Uploading...',
                success: <p>Post Added</p>,
                error: <p>Post Not Added</p>,
              })}
              className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer'
            >
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
