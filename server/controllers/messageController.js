import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// Create an empty object to store SS Event connections
const connections = {}; 

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
  const { userId } = req.params;
  const { token } = req.query;

  if (!token) return res.status(401).end();

  const { userId: tokenUserId } = req.auth({ token });

  if (tokenUserId !== userId) {
    return res.status(401).end();
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!connections[userId]) connections[userId] = [];
  connections[userId].push(res);

  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  req.on("close", () => {
    connections[userId] = connections[userId].filter(r => r !== res);
    if (!connections[userId].length) delete connections[userId];
  });
};


// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        if(message_type === 'image'){
            const fileBuffer =  fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            });
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    {quality: 'auto'},
                    {format: 'webp'},
                    {width: '1280'}
                ]
            })
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        })

        res.json({ success: true, message });

        // Send message to to_user_id using SSE

        const messageWithUserData = await Message.findById(message._id).populate('from_user_id');

        if(connections[to_user_id]){
           connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get Chat Messages
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;

        const messages = await Message.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId},
            ]
        }).sort({created_at: -1})
        // mark messages as seen
        await Message.updateMany({from_user_id: to_user_id, to_user_id: userId}, {seen: true})

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const messages = await Message.find({to_user_id: userId}).populate('from_user_id to_user_id').sort({ created_at: -1 });

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}