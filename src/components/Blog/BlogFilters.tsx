import React, { useState } from 'react';
import styled from 'styled-components';
import { RadioButton } from '../ui/RadioButton';

interface BlogFiltersProps {
  onFilterChange: (value: 'mine' | 'liked' | undefined) => void;
  onSortChange: (value: 'likes' | 'comments' | 'date_desc' | 'date_asc' | undefined) => void;
  currentFilter?: 'mine' | 'liked';
  currentSort?: 'likes' | 'comments' | 'date_desc' | 'date_asc';
  disabled?: boolean;
}

const BlogFilters: React.FC<BlogFiltersProps> = ({
  onFilterChange,
  onSortChange,
  currentFilter,
  currentSort,
  disabled = false
}) => {
  const handleFilterClick = (filter: 'all' | 'my' | 'liked') => {
    if (filter === 'all') {
      onFilterChange(undefined);
    } else if (filter === 'my') {
      onFilterChange('mine');
    } else {
      onFilterChange('liked');
    }
  };

  const handleSortChange = (sort: 'date' | 'popular' | 'comments') => {
    if (sort === 'date') {
      onSortChange('date_desc');
    } else if (sort === 'popular') {
      onSortChange('likes');
    } else {
      onSortChange('comments');
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <FilterContainer>
      <FilterSection>
        <FilterItem 
          active={!currentFilter} 
          onClick={() => handleFilterClick('all')}
        >
          Вся лента
        </FilterItem>
        <FilterItem 
          active={currentFilter === 'mine'} 
          onClick={() => handleFilterClick('my')}
        >
          Мой блог
        </FilterItem>
        <FilterItem 
          active={currentFilter === 'liked'} 
          onClick={() => handleFilterClick('liked')}
        >
          Понравившиеся посты
        </FilterItem>
      </FilterSection>

      <Divider />

      <SortTitle>Сортировать</SortTitle>

      <RadioButtonContainer>
        <RadioButton
          id="sort-date"
          name="sort"
          checked={currentSort === 'date_desc' || currentSort === undefined}
          onChange={() => handleSortChange('date')}
        >
          По дате публикации
        </RadioButton>

        <RadioButton
          id="sort-popular"
          name="sort"
          checked={currentSort === 'likes'}
          onChange={() => handleSortChange('popular')}
        >
          Самые популярные
        </RadioButton>

        <RadioButton
          id="sort-comments"
          name="sort"
          checked={currentSort === 'comments'}
          onChange={() => handleSortChange('comments')}
        >
          По количеству комментариев
        </RadioButton>
      </RadioButtonContainer>
    </FilterContainer>
  );
};

const FilterContainer = styled.div`
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 10px;
  background-color: white;
  padding: 20px;
  margin-top: 10px; 
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const FilterItem = styled.div<{ active: boolean }>`
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  background-color: ${({ active }) => 
    active ? 'rgba(209, 213, 219, 1)' : 'transparent'};
  font-weight: ${({ active }) => active ? '500' : '400'};
  transition: all 0.2s ease;
  text-align: left;
  color: black;
  
  &:hover {
    background-color: rgba(209, 213, 219, 0.5);
  }
`;

const Divider = styled.div`
  height: 0.5px;
  background-color: rgba(209, 213, 219, 1);
  margin: 16px 0;
`;

const SortTitle = styled.div`
  font-size: 14px;
  color: black;
  margin-bottom: 12px;
  text-align: left;
`;

const RadioButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export default BlogFilters;