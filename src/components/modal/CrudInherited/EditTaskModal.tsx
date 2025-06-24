import React, { useState, useEffect } from 'react';
import type { Task, TaskForm } from '../../../api/types/task';
import useTask from '../../../api/hooks/useTask';
import { useEmployee } from '../../../api/hooks/useEmployee';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomSelect from '../../ui/fields/CustomSelect';
import CustomCalendar from '../../ui/fields/CustomCalendar';
import InputTitle from '../../ui/Text/InputTitle';
import SelectPriority from '../../ui/fields/SelectPriority';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  task: Task;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onTaskUpdated, task }) => {
  const { updateTask } = useTask();
  const { fetchEmployeeFullnames } = useEmployee();
  const [assigneeOptions, setAssigneeOptions] = useState<{ value: string; label: string }[]>([]);
  const [responsibleOptions, setResponsibleOptions] = useState<{ value: string; label: string }[]>([]);
  const [formData, setFormData] = useState<TaskForm>({
    title: task.title,
    employeeId: task.employeeId,
    responsibleId: task.responsibleId,
    deadline: task.deadline.toString().split('T')[0],
    priority: task.priority
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoading(true);
        const fullNames = await fetchEmployeeFullnames();
        const options = fullNames.map(employee => ({
          value: employee.id.toString(),
          label: employee.fullName
        }));
        
        setAssigneeOptions(options);
        setResponsibleOptions([{ value: '', label: 'Нет ответственного' }, ...options]);
      } catch (error) {
        console.error('Error fetching employee names:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [isOpen, fetchEmployeeFullnames]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      deadline: date
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : null
    }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      priority: value as 'low' | 'medium' | 'high'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateTask(task.id, formData);
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Редактирование задачи"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting || isLoading}
      isSaveDisabled={!formData.title || !formData.deadline || isLoading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: "5px", maxWidth: "500px", marginLeft: "30px" }}>
        <InputTitle>Заголовок</InputTitle>
        <CustomInput
          style={{margin: 0, width: "100%"}}
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Задача"
          required
        />
        
        <div style={{ display: 'flex', gap: "20px", marginTop: "10px" }}>
          <div style={{ flex: 1, gap: "5px" }}>
            <InputTitle style={{ marginBottom: "5px" }}>Дата завершения</InputTitle>
            <CustomCalendar
              value={formData.deadline}
              onChange={handleDateChange}
            />
          </div>
          
          <div style={{ flex: 1, gap: "5px" }}>
            <InputTitle style={{ marginBottom: "5px" }}>Приоритет</InputTitle>
            <SelectPriority
              value={formData.priority}
              onChange={handlePriorityChange}
            />
          </div>
        </div>

        <InputTitle>Исполнитель</InputTitle>
        <CustomSelect
          name="employeeId"
          value={formData.employeeId?.toString() || ''}
          onChange={handleSelectChange}
          options={assigneeOptions}
          disabled={isLoading}
          required
        />
        
        <InputTitle>Ответственный</InputTitle>
        <CustomSelect
          name="responsibleId"
          value={formData.responsibleId?.toString() || ''}
          onChange={handleSelectChange}
          options={responsibleOptions}
          disabled={isLoading}
        />
      </div>
    </BaseModal>
  );
};

export default EditTaskModal;