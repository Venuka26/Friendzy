import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { addPost, getFeedPosts, likePost,sharePost } from '../controllers/postController.js';
import { addComment,getComments} from "../controllers/commentController.js";

const postRouter = express.Router()

postRouter.post('/add', upload.array('images', 4), protect, addPost)
postRouter.get('/feed', protect, getFeedPosts)
postRouter.post('/like', protect, likePost)

postRouter.post("/:postId/comment", protect, addComment);
postRouter.get("/:postId/comments", protect, getComments);
postRouter.post("/share/:postId", protect, sharePost); 

export default postRouter