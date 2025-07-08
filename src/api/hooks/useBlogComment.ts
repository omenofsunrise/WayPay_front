import { useState, useCallback } from 'react';
import blogCommentService from '../services/blogCommentService';
import type { BlogComment, BlogCommentForm } from '../types/blogComment';

const useBlogComment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);

  const getCommentsByPost = useCallback(async (postId: number): Promise<BlogComment[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await blogCommentService.getCommentsByPost(postId);
      setComments(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createComment = async (comment: BlogCommentForm): Promise<BlogComment | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdComment = await blogCommentService.createComment(comment);
      
      setComments(prev => {
        if (comment.parentId) {
          // If it's a reply, find the parent comment and add it to replies
          return prev.map(c => {
            if (c.id === comment.parentId) {
              return {
                ...c,
                replies: [...c.replies, createdComment]
              };
            }
            return c;
          });
        } else {
          // If it's a top-level comment, add it to the main list
          return [...prev, createdComment];
        }
      });
      
      return createdComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async (commentId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await blogCommentService.toggleLike(commentId);
      
      // Update the comment's like status in the state
      setComments(prev => {
        const updateCommentLikes = (comments: BlogComment[]): BlogComment[] => {
          return comments.map(c => {
            if (c.id === commentId) {
              const isLiked = !c.isLikedByCurrentUser;
              return {
                ...c,
                isLikedByCurrentUser: isLiked,
                likesCount: isLiked ? c.likesCount + 1 : c.likesCount - 1
              };
            }
            if (c.replies.length > 0) {
              return {
                ...c,
                replies: updateCommentLikes(c.replies)
              };
            }
            return c;
          });
        };
        
        return updateCommentLikes(prev);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (commentId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await blogCommentService.deleteComment(commentId);
      
      setComments(prev => {
        // First try to find and remove from top level
        const topLevelFiltered = prev.filter(c => c.id !== commentId);
        if (topLevelFiltered.length !== prev.length) {
          return topLevelFiltered;
        }
        
        // If not found at top level, look through replies
        return prev.map(c => ({
          ...c,
          replies: c.replies.filter(r => r.id !== commentId)
        }));
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAttachment = async (commentId: number, attachmentId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await blogCommentService.deleteAttachment(commentId, attachmentId);
      
      setComments(prev => {
        const updateCommentAttachments = (comments: BlogComment[]): BlogComment[] => {
          return comments.map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                attachments: c.attachments.filter(a => !a.url.endsWith(`/${attachmentId}`))
              };
            }
            if (c.replies.length > 0) {
              return {
                ...c,
                replies: updateCommentAttachments(c.replies)
              };
            }
            return c;
          });
        };
        
        return updateCommentAttachments(prev);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    comments,
    getCommentsByPost,
    createComment,
    toggleLike,
    deleteComment,
    deleteAttachment,
    setComments
  };
};

export default useBlogComment;