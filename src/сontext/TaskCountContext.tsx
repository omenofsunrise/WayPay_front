import React, { createContext, useContext, useState } from 'react';

interface TaskCountContextType {
  activeTasksCount: number;
  setActiveTasksCount: (count: number) => void;
}

const TaskCountContext = createContext<TaskCountContextType>({
  activeTasksCount: 0,
  setActiveTasksCount: () => {},
});

export const useTaskCount = () => useContext(TaskCountContext);

export const TaskCountProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [activeTasksCount, setActiveTasksCount] = useState(0);

  return (
    <TaskCountContext.Provider value={{ activeTasksCount, setActiveTasksCount }}>
      {children}
    </TaskCountContext.Provider>
  );
};