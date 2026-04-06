import Post from "../models/Post.js";

/* ================= ADD COMMENT ================= */
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user.id, // coming from auth middleware
      text,
    });

    await post.save();

    res.status(201).json({
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET COMMENTS ================= */
export const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "comments.user",
      "full_name profile_picture"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
