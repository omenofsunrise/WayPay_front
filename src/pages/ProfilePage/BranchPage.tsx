import PageLayout from "../../components/ui/Layouts/PageLayout";
import { useState, useEffect } from 'react';
import styled from 'styled-components';

import type { 
  BranchWithCoordinatesResponse, 
  CreateBranchRequest, 
  UpdateBranchRequest,
  WorkScheduleRequest 
} from '../../api/types/branch';
import { daysOfWeek, formatTimeForInput, formatTimeForApi } from '../../api/types/branch';
import useBranch from "../../api/hooks/useBranch";
import type { TableAction } from "antd/es/table/interface";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomTable, { type Column } from "../../components/ui/tables/CustomTable";
import YandexMapSelector from "../../components/YandexMapSelector";
import Checkbox from "../../components/ui/CheckBoxes/Checkbox";
import CustomInput from "../../components/ui/fields/CustomInput";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";

const BranchPage = () => {
  const { 
    isLoading, 
    error, 
    myBranches, 
    createBranch, 
    updateBranch, 
    deleteBranch,
    getMyBranches 
  } = useBranch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBranch, setSelectedBranch] = useState<BranchWithCoordinatesResponse | null>(null);
  const [formData, setFormData] = useState<CreateBranchRequest>({
    name: '',
    address: '',
    phone: '',
    latitude: 0,
    longitude: 0,
    schedules: []
  });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  const handleMapSelect = (address: string, lat: number, lon: number) => {
    setFormData(prev => ({
      ...prev,
      address: address,
      latitude: lat,
      longitude: lon
    }));
  };

  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  const columns: Column[] = [
    { name: 'Название', align: 'left' },
    { name: 'Адрес', align: 'left' },
    { name: 'Телефон', align: 'center' },
    // { name: 'Координаты', align: 'center' },
    // { name: 'Режим работы', align: 'center' }
  ];

  // Преобразование данных для таблицы
  const tableData = myBranches.map(branch => [
    branch.name,
    branch.address,
    branch.phone,
    // `${branch.latitude.toFixed(6)}, ${branch.longitude.toFixed(6)}`,
    // formatSchedule(branch.schedules)
  ]);

  // Форматирование расписания для отображения
  function formatSchedule(schedules: WorkScheduleRequest[]) {
    const workingDays = schedules.filter(s => s.isWorking);
    if (workingDays.length === 0) return 'Не работает';
    
    const firstDay = workingDays[0];
    const lastDay = workingDays[workingDays.length - 1];
    
    return `${firstDay.dayOfWeek}-${lastDay.dayOfWeek} ${firstDay.openTime.slice(0, 5)}-${firstDay.closeTime.slice(0, 5)}`;
  }

  // Действия контекстного меню
  const contextMenuActions: TableAction[] = [
    {
      label: 'Редактировать',
      action: (rowData, rowIndex) => handleEdit(rowIndex),
      color: '#007D88'
    },
    {
      label: 'Удалить',
      action: (rowData, rowIndex) => handleDelete(rowIndex),
      color: '#dc2626'
    }
  ];

  // Загрузка данных при монтировании
  useEffect(() => {
    getMyBranches();
  }, [getMyBranches]);

  // Инициализация расписания по умолчанию
  useEffect(() => {
    if (modalMode === 'create' && formData.schedules.length === 0) {
      const defaultSchedules = daysOfWeek.map(day => ({
        dayOfWeek: day,
        openTime: '09:00:00',
        closeTime: '18:00:00',
        isWorking: day !== 'Sunday'
      }));
      setFormData(prev => ({ ...prev, schedules: defaultSchedules }));
    }
  }, [modalMode, formData.schedules.length]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      latitude: 0,
      longitude: 0,
      schedules: daysOfWeek.map(day => ({
        dayOfWeek: day,
        openTime: '09:00:00',
        closeTime: '18:00:00',
        isWorking: day !== 'Sunday'
      }))
    });
    setIsModalOpen(true);
  };

  const handleEdit = (rowIndex: number) => {
    const branch = myBranches[rowIndex];
    if (!branch) return;

    setModalMode('edit');
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      latitude: branch.latitude,
      longitude: branch.longitude,
      schedules: branch.schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime,
        closeTime: s.closeTime,
        isWorking: s.isWorking
      }))
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (rowIndex: number) => {
    const branch = myBranches[rowIndex];
    if (!branch || !window.confirm(`Вы уверены, что хотите удалить отделение "${branch.name}"?`)) return;

    try {
      await deleteBranch(branch.id);
    } catch (error) {
      console.error('Ошибка при удалении отделения:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await createBranch(formData);
      } else if (selectedBranch) {
        await updateBranch(selectedBranch.id, formData as UpdateBranchRequest);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Ошибка при сохранении отделения:', error);
    }
  };

  const handleInputChange = (field: keyof CreateBranchRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (dayIndex: number, field: keyof WorkScheduleRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, index) =>
        index === dayIndex ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const handleTimeChange = (dayIndex: number, field: 'openTime' | 'closeTime', timeValue: string) => {
    const formattedTime = formatTimeForApi(timeValue);
    handleScheduleChange(dayIndex, field, formattedTime);
  };

  return (
    <PageLayout>
      <PageContainer>
        <PageHeader>
          <Title>Управление отделениями</Title>
          <CreateButton onClick={handleCreate}>
            + Добавить отделение
          </CreateButton>
        </PageHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <TableContainer>
          <CustomTable
            columns={columns}
            data={tableData}
            contextMenuActions={contextMenuActions}
            isLoading={isLoading}
          />
        </TableContainer>

        {isModalOpen && (
          <BaseModal
            title={modalMode === 'create' ? 'Добавление отделения' : 'Редактирование отделения'}
            onClose={() => setIsModalOpen(false)}
            onCancel={() => setIsModalOpen(false)}
            onSave={handleSubmit}
            width="900px"
          >
            <FormContainer>
              <FormGrid>
                <FormGroup>
                  <Label>Название отделения *</Label>
                  <CustomInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Телефон *</Label>
                  <PhoneModalInput
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </FormGroup>
              </FormGrid>

              <AddressSection>
                <AddressHeader>
                  <Label>Адрес отделения *</Label>
                  <MapButton type="button" onClick={openMapModal}>
                    🗺️ Выбрать на карте
                  </MapButton>
                </AddressHeader>
                
                <AddressInfo>
                  <div>Адрес: <strong>{formData.address || 'Не выбран'}</strong></div>
                  <div>Координаты: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</div>
                </AddressInfo>
              </AddressSection>

              <ScheduleSection>
                <ScheduleTitle>Режим работы</ScheduleTitle>
                {formData.schedules.map((schedule, index) => (
                  <ScheduleRow key={schedule.dayOfWeek}>
                    <DayLabel>
                      <Checkbox
                        checked={schedule.isWorking}
                        onChange={(e) => handleScheduleChange(index, 'isWorking', e)}
                      />
                      {getDayName(schedule.dayOfWeek)}
                    </DayLabel>
                    
                    <TimeInputs>
                      <TimeInput
                        type="time"
                        value={formatTimeForInput(schedule.openTime)}
                        onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                        disabled={!schedule.isWorking}
                      />
                      <TimeSeparator>—</TimeSeparator>
                      <TimeInput
                        type="time"
                        value={formatTimeForInput(schedule.closeTime)}
                        onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                        disabled={!schedule.isWorking}
                      />
                    </TimeInputs>
                  </ScheduleRow>
                ))}
              </ScheduleSection>
            </FormContainer>
          </BaseModal>
        )}

        {isMapModalOpen && (
          <BaseModal
            title="Выберите расположение отделения"
            onClose={() => setIsMapModalOpen(false)}
            onCancel={() => setIsMapModalOpen(false)}
            onSave={() => setIsMapModalOpen(false)}
            saveText="Готово"
            width="800px"
          >
            <YandexMapSelector
              onLocationSelect={handleMapSelect}
              initialAddress={formData.address}
              initialLat={formData.latitude}
              initialLon={formData.longitude}
            />
          </BaseModal>
        )}
      </PageContainer>
    </PageLayout>
  );
};

const AddressSection = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const AddressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MapButton = styled.button`
  background-color: #007D88;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background-color: #006670;
  }
`;

const AddressInfo = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
`;

function getDayName(day: string): string {
  const daysMap: { [key: string]: string } = {
    'Monday': 'Понедельник',
    'Tuesday': 'Вторник',
    'Wednesday': 'Среда',
    'Thursday': 'Четверг',
    'Friday': 'Пятница',
    'Saturday': 'Суббота',
    'Sunday': 'Воскресенье'
  };
  return daysMap[day] || day;
}

export default BranchPage;

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: #007D88;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background-color: #006670;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 400px;
`;

const FormContainer = styled.div`
  display: flex;
  padding: 0 25px;
  flex-direction: column;
  gap: 24px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  text-align: left;
  font-weight: 500;
  color: #374151;
`;

const ScheduleSection = styled.div`
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
`;

const ScheduleTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #374151;
`;

const ScheduleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const DayLabel = styled.label`
  display: flex;
  color: black;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
`;

const TimeInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeInput = styled.input`
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background-color: #f9fafb;
  color: black;

  &:disabled {
    background-color: black;
    color: #6b7280;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: #007D88;
  }
`;

const TimeSeparator = styled.span`
  color: #6b7280;
  font-size: 14px;
`;