import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const toneInstructions = {
  professional: 'Rewrite this in a professional, polished tone suitable for a LinkedIn-style audience.',
  casual: 'Rewrite this in a friendly, casual, conversational tone like texting a friend.',
  funny: 'Rewrite this with humor and wit — make it entertaining while keeping the core message.',
}

// Try models in order until one works
const MODELS = ['gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',]

export const enhancePost = async (req, res) => {
  try {
    const { content, tone = 'professional' } = req.body

    if (!content || !content.trim()) {
      return res.json({ success: false, message: 'No content to enhance' })
    }

    const tonePrompt = toneInstructions[tone] || toneInstructions.professional

    const prompt = `You are a social media writing assistant. ${tonePrompt}

Improve the post below — fix grammar, make it more engaging, and expand it slightly if needed.
Return ONLY the improved post text with no explanation, no quotes, no preamble.

Post:
${content}`

    let enhanced = null
    let lastError = null

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        enhanced = result.response.text().trim()
        break
      } catch (err) {
        lastError = err
        continue
      }
    }

    if (!enhanced) throw lastError

    res.json({ success: true, enhanced })
  } catch (error) {
    console.error('AI enhance error:', error.message)
    res.json({ success: false, message: error.message })
  }
}
