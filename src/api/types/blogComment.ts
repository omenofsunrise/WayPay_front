import type { FileAttachment } from "./blog";

export interface BlogComment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  attachments: CommentFileAttachment[];
  likeCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: Date;
  authorId: number;
  authorName: string;
  authorPhotoPath?: string;
  replies: BlogComment[];
}

export interface BlogCommentForm {
  postId: number;
  parentId?: number;
  content: string;
  attachments: File[];
}

export interface CommentFileAttachment {
  id: number;
  filePath: string;
  isImage: boolean;
  fileName: string;
}