import type { PaginationParams, PaginatedResponse } from "./common";

export interface BlogPost {
  id: number;
  content: string;
  images: string[];
  files: string[];
  isPublished: boolean;
  likesCount: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  authorFullName: string;
  authorPhotoPath: string;
}

export interface BlogPostForm {
  content: string;
  images: File[];
  files: File[];
}

export interface BlogFeedParams {
  filter?: string;
  sortBy?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BlogParams extends PaginationParams {
  mode?: 'feed' | 'search';
  search?: string;
  sort?: 'date_desc';
}