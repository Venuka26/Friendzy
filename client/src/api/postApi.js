import api from "./axios";

export const addComment = async (postId, text, token) =>
  api.post(
    `/api/post/${postId}/comment`,
    { text },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );


  export const getComments = async (postId, token) =>
  api.get(`/api/post/${postId}/comments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

