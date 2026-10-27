import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import type { Task } from "../../api/types/task";
import TaskItem from "./TaskItem";
import useTask from "../../api/hooks/useTask";
import { createPortal } from "react-dom";
import BaseModal from "../modal/BASE/modalCRUBase";

interface CompletedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompletedTasksModal = ({ isOpen, onClose }: CompletedTasksModalProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { getCompletedTasks, isLoading } = useTask();
  const pageSize = 10;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTasks([]);
      setCurrentPage(1);
      setHasMore(true);
      loadCompletedTasks(); // Начинаем загрузку с первой страницы
    } else {
      // Очищаем при закрытии
      setTasks([]);
      setCurrentPage(1);
      setHasMore(true);
    }
  }, [isOpen]);

  const loadCompletedTasks = async (page: number) => {
    if (isLoading) return;
    
    try {
      const response = await getCompletedTasks(page, pageSize);
      if (response && response.tasks) {
        setTasks(prev => page === 1 ? response.tasks : [...prev, ...response.tasks]);
        setHasMore(page < (response.totalPages || 1));
        setCurrentPage(page + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load completed tasks:", error);
      setHasMore(false);
    }
  };

  const handleScroll = () => {
    if (listRef.current && !isLoading && hasMore) {
      const { scrollTop, clientHeight, scrollHeight } = listRef.current;
      if (scrollHeight - (scrollTop + clientHeight) < 50) {
        loadCompletedTasks(currentPage);
      }
    }
  };

    useEffect(() => {
        const listElement = listRef.current;
        if (listElement) {
        listElement.addEventListener('scroll', handleScroll);
        return () => {
            listElement.removeEventListener('scroll', handleScroll);
        };
        }
    }, [currentPage, hasMore, isLoading])

  const modalContent = (
    <BaseModal
      isOpen={isOpen}
      title="Выполненные задачи"
      subtitle="История завершённых задач"
      appearance="compact-form"
      width="800px"
      maxHeight="calc(100vh - 32px)"
      onClose={onClose}
      onCancel={onClose}
      hideSaveButton
      hideCanselButton
    >
      <TasksList ref={listRef}>
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onDragStart={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            disableContextMenu
          />
        ))}
        {!isLoading && tasks.length === 0 && (
          <EmptyState>Выполненных задач пока нет</EmptyState>
        )}
        {isLoading && <LoadingText>Загрузка...</LoadingText>}
      </TasksList>
    </BaseModal>
  );

  return createPortal(modalContent, document.body);
};

const TasksList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px 34px 24px;
  max-height: 60vh;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: #f1f1f1;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
`;

export default CompletedTasksModal;
