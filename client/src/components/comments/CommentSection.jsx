import { useEffect, useState } from "react";
import { addComment, getComments } from "../../api/postApi";
import { useAuth } from "@clerk/clerk-react";

const CommentSection = ({ postId, onCommentAdded }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();

  const loadComments = async () => {
    try {
    setLoading(true);

    const token = await getToken(); // 🔥 REQUIRED
    const res = await getComments(postId, token);

    const fetchedComments =
      Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.comments)
        ? res.data.comments
        : [];

    setComments(fetchedComments);
  } catch (err) {
    console.error("Failed to load comments", err);
    setComments([]);
  } finally {
    setLoading(false);
  }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    try {
      const token = await getToken();
      await addComment(postId, comment, token);

      setComment("");
      loadComments();

      onCommentAdded?.(); // update count
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  useEffect(() => {
    if (postId) loadComments();
  }, [postId]);

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 rounded"
        >
          Post
        </button>
      </div>

      {/* COMMENTS */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet</p>
      ) : (
        comments.map((c) => (
          <div key={c._id} className="flex gap-3">
            <img
              src={c.user?.profile_picture || "https://via.placeholder.com/32"}
              alt={c.user?.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-sm">{c.user?.full_name}</p>
              <p className="text-sm text-gray-700">{c.text}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CommentSection;
