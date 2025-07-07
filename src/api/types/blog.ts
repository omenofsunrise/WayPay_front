import type { PaginationParams, PaginatedResponse } from "./common";

export interface BlogPost {
  id: number;
  content: string;
  imageUrls: string[];
  attachments: FileAttachment[];
  isPublished: boolean;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  commentsCount: number;
  createdAt: Date;
  authorId: number;
  authorName: string;
  authorAvatarPath?: string;
  isAuthor: boolean;
}

export interface FileAttachment {
  url: string;
  name: string;
  size: number;
}

export interface FileDownloadResponse {
  url: string;
  name: string;
  blob: Blob;
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

export interface BlogPostCreateRequest {
  content: string;
  images?: File[];
  files?: File[];
}

export interface BlogPostFilterRequest {
  filter?: string;
  sortBy?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}