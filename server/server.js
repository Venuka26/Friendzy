import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './configs/db.js';
import { inngest,functions } from "./inngest/index.js";
import { serve } from  'inngest/express';
import { clerkMiddleware } from "@clerk/express";
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' }
});

await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req,res)=> res.send('Server is running'));
app.use('/api/inngest', serve({client: inngest, functions}))
app.use('/api/user', userRouter);
app.use('/api/post',postRouter)
app.use('/api/story',storyRouter)
app.use('/api/message',messageRouter)

// Map userId -> socketId for signaling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  // Register user with their userId
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // Caller initiates a call
  socket.on('call-user', ({ to, from, offer, callerName, callerPhoto }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call-incoming', { from, offer, callerName, callerPhoto });
    }
  });

  // Callee accepts
  socket.on('call-accepted', ({ to, answer }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call-accepted', { answer });
    }
  });

  // Callee rejects
  socket.on('call-rejected', ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call-rejected');
    }
  });

  // ICE candidates exchange
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { candidate });
    }
  });

  // Call ended by either side
  socket.on('call-ended', ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended');
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT,()=> console.log(`Server is running on port ${PORT}`))