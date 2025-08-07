import type { BlogPost, BlogPostForm, BlogFeedParams, BlogParams, FileDownloadResponse } from '../types/blog';
import type { PaginatedResponse } from '../types/common';
import socialApiClient from '../socialApiClient';

class BlogService {
  async getPosts(params?: BlogParams): Promise<PaginatedResponse<BlogPost>> {
    const response = await socialApiClient.get<PaginatedResponse<BlogPost>>('/Blog', { 
      params: {
        ...params,
        filter: params?.filter,
        sortBy: params?.sortBy,
        search: params?.search,
        page: params?.page,
        pageSize: params?.pageSize
      }
    });
    return response.data;
  }

  async getPostById(postId: number): Promise<BlogPost> {
    const response = await socialApiClient.get<BlogPost>(`/Blog/${postId}`);
    return response.data;
  }

  async createPost(post: BlogPostForm): Promise<BlogPost> {
    const formData = new FormData();
    formData.append('Content', post.content);
    
    post.images.forEach((image) => {
      formData.append('Images', image);
    });
    
    post.files.forEach((file) => {
      formData.append('Files', file);
    });

    const response = await socialApiClient.post<BlogPost>('/Blog', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async publishPost(id: number): Promise<void> {
    await socialApiClient.put(`/Blog/${id}/publish`);
  }

  async deleteAttachment(postId: number, attachmentId: number): Promise<void> {
    await socialApiClient.delete(`/Blog/${postId}/attachments/${attachmentId}`);
  }

  async toggleLike(postId: number): Promise<void> {
    await socialApiClient.post(`/Blog/${postId}/like`);
  }

   async downloadAttachment(attachmentId: number): Promise<FileDownloadResponse> {
    const response = await socialApiClient.get(`/Blog/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    return {
      url: URL.createObjectURL(response.data),
      name: filename,
      blob: response.data
    };
  }

  async deletePost(postId: number): Promise<void> {
    await socialApiClient.delete(`/Blog/${postId}`);
  }
}

export default new BlogService();