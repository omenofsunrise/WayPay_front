import { useState, useCallback } from 'react';
import blogService from '../services/blogService';
import type { BlogPost, BlogPostForm, BlogFeedParams, BlogParams } from '../types/blog';
import type { PaginatedResponse } from '../types/common';

const useBlog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);

  const getPosts = useCallback(async (params?: BlogParams): Promise<PaginatedResponse<BlogPost> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await blogService.getPosts(params);
      setPosts(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFeed = useCallback(async (params: BlogFeedParams): Promise<PaginatedResponse<BlogPost> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await blogService.getFeed(params);
      setPosts(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = async (post: BlogPostForm): Promise<BlogPost | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdPost = await blogService.createPost(post);
      return createdPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const publishPost = async (id: number): Promise<BlogPost | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPost = await blogService.publishPost(id);
      updatePostInList(updatedPost);
      return updatedPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const likePost = async (postId: number): Promise<BlogPost | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPost = await blogService.likePost(postId);
      updatePostInList(updatedPost);
      return updatedPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAttachment = async (postId: number, attachmentId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await blogService.deleteAttachment(postId, attachmentId);
      if (posts) {
        const updatedItems = posts.items.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              images: post.images.filter(img => !img.endsWith(`/${attachmentId}`)),
              files: post.files.filter(file => !file.endsWith(`/${attachmentId}`))
            };
          }
          return post;
        });
        setPosts({ ...posts, items: updatedItems });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePostInList = (updatedPost: BlogPost) => {
    if (posts) {
      const updatedItems = posts.items.map(item => 
        item.id === updatedPost.id ? updatedPost : item
      );
      setPosts({ ...posts, items: updatedItems });
    }
  };

  return {
    isLoading,
    error,
    posts,
    currentPost,
    getPosts,
    getFeed,
    createPost,
    publishPost,
    likePost,
    deleteAttachment,
    setCurrentPost
  };
};

export default useBlog;