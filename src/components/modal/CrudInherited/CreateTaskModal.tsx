import React, { useState, useEffect } from 'react';
import type { TaskForm } from '../../../api/types/task';
import useTask from '../../../api/hooks/useTask';
import { useEmployee } from '../../../api/hooks/useEmployee';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomCalendar from '../../ui/fields/CustomCalendar';
import InputTitle from '../../ui/Text/InputTitle';
import SelectPriority from '../../ui/fields/SelectPriority';
import { useAuth } from '../../../сontext/AuthContext';
import UserSelect from '../../ui/fields/UserSelect';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultAssigneeId?: number; 
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onTaskCreated,
  defaultAssigneeId 
}) => {
  const { createTask } = useTask();
  const { fetchEmployeeFullnames } = useEmployee();
  const [assigneeOptions, setAssigneeOptions] = useState<{ value: string; label: string; avatar?: string }[]>([]);
  const [responsibleOptions, setResponsibleOptions] = useState<{ value: string; label: string; avatar?: string }[]>([]);
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    employeeId: 1,
    responsibleId: null,
    deadline: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { authInfo } = useAuth();
  
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoading(true);
        const fullNames = await fetchEmployeeFullnames();
        const options = fullNames.map(employee => ({
          value: employee.id.toString(),
          label: employee.fullName,
          avatar: employee.photoPath
        }));
        
        setAssigneeOptions(options);
        setResponsibleOptions([{ value: '', label: 'Нет ответственного' }, ...options]);
        
        let defaultEmployeeId = 1;
        
        if (defaultAssigneeId) {
          defaultEmployeeId = defaultAssigneeId;
        } else if (authInfo) {
          defaultEmployeeId = authInfo.employee.id;
        } else if (options.length > 0) {
          defaultEmployeeId = parseInt(options[0].value);
        }

        setFormData(prev => ({
          ...prev,
          employeeId: defaultEmployeeId,
          responsibleId: null
        }));
      } catch (error) {
        console.error('Error fetching employee names:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [isOpen, fetchEmployeeFullnames, authInfo, defaultAssigneeId]);

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

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      employeeId: value ? parseInt(value) : 1
    }));
  };

  const handleResponsibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      responsibleId: value ? parseInt(value) : null
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
      await createTask(formData);
      onTaskCreated();
      onClose();
      setFormData({
        title: '',
        employeeId: assigneeOptions[0]?.value ? parseInt(assigneeOptions[0].value) : 1,
        responsibleId: null,
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
        <UserSelect
          name="employeeId"
          value={formData.employeeId?.toString() || ''}
          onChange={handleAssigneeChange}
          options={assigneeOptions}
          disabled={isLoading}
          placeholder="Выберите исполнителя"
          style={{ width: "100%", margin: 0 }}
        />
        
        <InputTitle>Ответственный</InputTitle>
        <UserSelect
          name="responsibleId"
          value={formData.responsibleId?.toString() || ''}
          onChange={handleResponsibleChange}
          options={responsibleOptions}
          disabled={isLoading}
          placeholder="Выберите ответственного"
          style={{ width: "100%", margin: 0 }}
        />
      </div>
    </BaseModal>
  );
};

export default CreateTaskModal;