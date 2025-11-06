import React, { useEffect, useState } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import FileRecepient from '../../Blog/FileRecepient';
import ModalInfoTitle from '../../ui/Text/ModalInfoTitle';
import CustomTextArea from '../../ui/fields/CustomTextArea';
import { Container } from 'react-bootstrap';
import DarkCyanButton from '../../ui/Buttons/DarkCyanButton';
import useBlog from '../../../api/hooks/useBlog';
import type { BlogPost, BlogPostForm } from '../../../api/types/blog';
import CustomSelect from '../../ui/fields/CustomSelect';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (postData: BlogPostForm) => Promise<void>;
  postToEdit?: BlogPost | null;
  onUpdate?: (postId: number, postData: BlogPostForm) => Promise<void>;
}

const CreatePostModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  postToEdit,
  onUpdate 
}: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'AllUsers' | 'Clients' | 'Employees'>('AllUsers');  
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const { isLoading } = useBlog();

  const MAX_FILES = 10;
  const MAX_FILE_SIZE_MB = 10;

  const audienceOptions = [
    { value: 'AllUsers' as const, label: 'Для всех пользователей' },
    { value: 'Clients' as const, label: 'Только для клиентов' },
    { value: 'Employees' as const, label: 'Только для сотрудников' }
  ];

  useEffect(() => {
    if (postToEdit) {
      setContent(postToEdit.content);
      setAudience(postToEdit.audience || 'AllUsers');
      setFiles([]);
    } else {
      resetForm();
    }
  }, [postToEdit]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && files.length === 0) {
      setError('Пост должен содержать текст или файлы');
      return;
    }

    const formData: BlogPostForm = {
      content,
      images: files.filter(file => file.type.startsWith('image/')),
      files: files.filter(file => !file.type.startsWith('image/')),
      audience
    };

    try {
      if (postToEdit && onUpdate) {
        await onUpdate(postToEdit.id, formData);
      } else if (onSubmit) {
        await onSubmit(formData);
      }
      resetForm();
      onClose();
    } catch (err) {
      setError('Ошибка при сохранении поста');
    }
  };

  const resetForm = () => {
    setContent('');
    setAudience('AllUsers');
    setFiles([]);
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    
    if (files.length + newFiles.length > MAX_FILES) {
      setError(`Максимальное количество файлов: ${MAX_FILES}`);
      return;
    }
    
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Максимальный размер файла: ${MAX_FILE_SIZE_MB}MB`);
        return;
      }
    }
    
    setError('');
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  const customHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 60px)', margin: "0 auto" }}>
      <h2 style={{ fontSize: '30px', fontWeight: 600, color: '#000', margin: 0 }}>
        {postToEdit ? 'Редактирование поста' : 'Создание поста'}
      </h2>
      <div>
        <input
          type="file"
          id="file-upload"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          onClick={(e) => e.stopPropagation()}
        />
        <DarkCyanButton 
          style={{ minWidth: '136px', margin: '0', borderRadius: '10px', fontSize: '16px' }}
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById('file-upload')?.click();
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Загрузить файл'}
        </DarkCyanButton>
      </div>
    </div>
  );

  return (
    <BaseModal
      customLayout={customHeader}
      onClose={() => {
        resetForm();
        onClose();
      }}
      onCancel={() => {
        resetForm();
        onClose();
      }}
      onSave={handleSubmit}
      mode={postToEdit ? "edit" : "create"}
      saveButtonText={isLoading ? 'Сохранение...' : postToEdit ? 'Сохранить' : 'Опубликовать'}
      isSaveDisabled={(content.trim().length === 0 && files.length === 0) || isLoading}
    >
      <Container style={{ height: "20px" }}></Container>
      {error && <div style={{ color: 'red', margin: '0 30px', textAlign: 'center' }}>{error}</div>}
      
      <div style={{ margin: '0 30px 20px' }}>
        <ModalInfoTitle style={{ margin: "0 0 10px 0" }}>Аудитория</ModalInfoTitle>
        <CustomSelect
          options={audienceOptions}
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
          placeholder="Выберите аудиторию"
          disabled={isLoading}
        />
      </div>

      <FileRecepient 
        files={files} 
        onFileRemove={handleFileRemove} 
        onFilesUpload={handleFileUpload}
        onFilePreview={handleFilePreview}
      />
      <ModalInfoTitle style={{ margin: "20px 30px 10px" }}>Текст поста</ModalInfoTitle>
      <CustomTextArea 
        placeholder='Напишите что-нибудь...'
        rows={6}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError('');
        }}
        disabled={isLoading}
      />
    </BaseModal>
  );
};

export default CreatePostModal;