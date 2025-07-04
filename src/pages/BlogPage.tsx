import React, { useState } from 'react';
import BlogLayout from "../components/Blog/BlogLayout";
import WhiteButton from "../components/ui/Buttons/WhiteButton";
import PageLayout from "../components/ui/Layouts/PageLayout";
import CreatePostModal from '../components/modal/CrudInherited/CreatePostModal';

const BlogPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <PageLayout>
      <BlogLayout>
        <WhiteButton 
          text={"+ Создать пост"}
          onClick={handleOpenCreateModal}
        />
        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={handleCloseCreateModal} 
        />
      </BlogLayout>
    </PageLayout>
  );
};

export default BlogPage;