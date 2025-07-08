import type { FileAttachment } from "./blog";

export interface BlogComment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  attachments: FileAttachment[];
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: Date;
  authorId: number;
  authorName: string;
  authorAvatarPath?: string;
  isAuthor: boolean;
  replies: BlogComment[];
}

export interface BlogCommentForm {
  postId: number;
  parentId?: number;
  content: string;
  attachments: File[];
}