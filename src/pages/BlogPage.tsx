import React, { useState, useEffect } from 'react';
import BlogLayout from "../components/Blog/BlogLayout";
import WhiteButton from "../components/ui/Buttons/WhiteButton";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CreatePostModal from '../components/modal/CrudInherited/CreatePostModal';
import BlogFiltersLayout from '../components/Blog/BlogFiltersLayout';
import SearchField from '../components/Blog/SearchField';
import BlogFilters from '../components/Blog/BlogFilters';
import PostItem from '../components/Blog/PostItem';
import useBlog from '../api/hooks/useBlog';
import type { BlogPostForm, BlogParams } from '../api/types/blog';

const BlogPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<BlogParams>({
    search: '',
    filter: undefined,
    sortBy: undefined,
    page: 1,
    pageSize: 10
  });

  const { posts, getPosts, createPost, toggleLike, isLoading, error } = useBlog();

  useEffect(() => {
    getPosts(filters);
  }, [filters, getPosts]);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreatePost = async (postData: BlogPostForm) => {
    await createPost(postData);
    getPosts(filters);
    handleCloseCreateModal();
  };

  const handleSearch = (searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue, page: 1 }));
  };

  const handleFilterChange = (filterValue: 'mine' | 'liked' | undefined) => {
    setFilters(prev => ({ ...prev, filter: filterValue, page: 1 }));
  };

  const handleSortChange = (sortValue: 'likes' | 'comments' | 'date_desc' | 'date_asc' | undefined) => {
    setFilters(prev => ({ ...prev, sortBy: sortValue, page: 1 }));
  };

  return (
    <PageLayout style={{
      display: "flex",
      flexDirection: "row",
      margin: "0 100px",
      gap: "20px"
    }}>
      <BlogLayout>
        <WhiteButton 
          text={"+ Создать пост"}
          onClick={handleOpenCreateModal}
        />
        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={handleCloseCreateModal}
          onSubmit={handleCreatePost}
        />

        {isLoading && !posts && <div>Загрузка...</div>}
        {error && <div className="text-red-500">{error}</div>}
        
        {posts?.items.map(post => (
          <PostItem 
            key={post.id} 
            post={post} 
            onToggleLike={toggleLike}
          />
        ))}

        {posts?.items.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Посты не найдены. Попробуйте изменить параметры поиска.
          </div>
        )}
      </BlogLayout>
      
      <BlogFiltersLayout>
        <SearchField 
          onSearch={handleSearch} 
          initialValue={filters.search}
        />
        <BlogFilters 
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          currentFilter={filters.filter}
          currentSort={filters.sortBy}
        />
      </BlogFiltersLayout>
    </PageLayout>
  );
};

export default BlogPage;