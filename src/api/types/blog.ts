import type { PaginationParams, PaginatedResponse } from "./common";

export interface BlogPost {
  id: number;
  content: string;
  images: string[];
  attachments: string[];
  isPublished: boolean;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  authorName: string;
  authorPhotoPath: string;
}

export interface BlogPostForm {
  content: string;
  images: File[];
  files: File[];
}

export interface BlogFeedParams {
  filter?: 'mine' | 'liked';
  sortBy?: 'likes' | 'comments' | 'date_desc' | 'date_asc';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BlogParams extends PaginationParams {
  filter?: 'mine' | 'liked';
  sortBy?: 'likes' | 'comments' | 'date_desc' | 'date_asc';
  search?: string;
}