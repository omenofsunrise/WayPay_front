import type { BlogPost, BlogPostForm, BlogFeedParams, BlogParams } from '../types/blog';
import type { PaginatedResponse } from '../types/common';
import socialApiClient from '../socialApiClient';

class BlogService {
  async getPosts(params?: BlogParams): Promise<PaginatedResponse<BlogPost>> {
    const response = await socialApiClient.get<PaginatedResponse<BlogPost>>('/Blog', { 
      params
    });
    return response.data;
  }

  async getFeed(params: BlogFeedParams): Promise<PaginatedResponse<BlogPost>> {
    const response = await socialApiClient.post<PaginatedResponse<BlogPost>>('/Blog/feed', params);
    return response.data;
  }

  async createPost(post: BlogPostForm): Promise<BlogPost> {
    const formData = new FormData();
    formData.append('Content', post.content);
    
    post.images.forEach((image, index) => {
      formData.append(`Images`, image);
    });
    
    post.files.forEach((file, index) => {
      formData.append(`Files`, file);
    });

    const response = await socialApiClient.post<BlogPost>('/Blog', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async publishPost(id: number): Promise<BlogPost> {
    const response = await socialApiClient.put<BlogPost>(`/Blog/${id}/publish`);
    return response.data;
  }

  async likePost(postId: number): Promise<BlogPost> {
    const response = await socialApiClient.post<BlogPost>(`/Blog/${postId}/like`);
    return response.data;
  }

  async deleteAttachment(postId: number, attachmentId: number): Promise<void> {
    await socialApiClient.delete(`/Blog/${postId}/attachments/${attachmentId}`);
  }
}

export default new BlogService();