import React, { useState } from 'react';
import type { TaskForm } from '../../../api/types/task';
import useTask from '../../../api/hooks/useTask';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomSelect from '../../ui/fields/CustomSelect';
import CustomCalendar from '../../ui/fields/CustomCalendar';
import ModalInfoTitle from '../../ui/Text/ModalInfoTitle';
import InputTitle from '../../ui/Text/InputTitle';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const priorityOptions = [
  { value: 'low', label: 'Низкий приоритет' },
  { value: 'medium', label: 'Средний приоритет' },
  { value: 'high', label: 'Высокий приоритет' }
];

const assigneeOptions = [
  { value: '1', label: 'Иван Иванов' },
  { value: '2', label: 'Петр Петров' },
  { value: '3', label: 'Сергей Сергеев' }
];

const responsibleOptions = [
  { value: '1', label: 'Иван Иванов' },
  { value: '2', label: 'Петр Петров' },
  { value: '3', label: 'Сергей Сергеев' }
];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
  const { createTask } = useTask();
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    employeeId: 1,
    responsibleId: 1,
    deadline: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      [name]: parseInt(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createTask(formData);
      onTaskCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        employeeId: 1,
        responsibleId: 1,
        deadline: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Создание задачи"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
      isSaveDisabled={!formData.title || !formData.deadline}
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
            <CustomSelect
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              options={priorityOptions}
            />
          </div>
        </div>

        <InputTitle>Исполнитель</InputTitle>
        <CustomSelect
          name="employeeId"
          value={formData.employeeId.toString()}
          onChange={handleSelectChange}
          options={assigneeOptions}
        />
        
        <InputTitle>Ответственный</InputTitle>
        <CustomSelect
          name="responsibleId"
          value={formData.responsibleId.toString()}
          onChange={handleSelectChange}
          options={responsibleOptions}
        />
      </div>
    </BaseModal>
  );
};

export default CreateTaskModal;