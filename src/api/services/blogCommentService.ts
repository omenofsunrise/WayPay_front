import type { BlogComment, BlogCommentForm } from '../types/blogComment';
import socialApiClient from '../socialApiClient';

class BlogCommentService {
  async getCommentsByPost(postId: number): Promise<BlogComment[]> {
    const response = await socialApiClient.get<BlogComment[]>(`/BlogComment/post/${postId}`);
    return response.data;
  }

  async createComment(comment: BlogCommentForm): Promise<BlogComment> {
    const formData = new FormData();
    formData.append('PostId', comment.postId.toString());
    if (comment.parentId) {
      formData.append('ParentId', comment.parentId.toString());
    }
    formData.append('Content', comment.content);
    
    comment.attachments.forEach((file) => {
      formData.append('Attachments', file);
    });

    const response = await socialApiClient.post<BlogComment>('/BlogComment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async toggleLike(commentId: number): Promise<void> {
    await socialApiClient.post(`/BlogComment/${commentId}/like`);
  }

  async deleteComment(commentId: number): Promise<void> {
    await socialApiClient.delete(`/BlogComment/${commentId}`);
  }

  async deleteAttachment(commentId: number, attachmentId: number): Promise<void> {
    await socialApiClient.delete(`/BlogComment/${commentId}/attachments/${attachmentId}`);
  }
}

export default new BlogCommentService();