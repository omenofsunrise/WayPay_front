import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable from "../components/ui/fields/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import QueueModal from "../components/modal/QueueModal";
import useQueue from "../api/hooks/useQueue";
import useClients from "../api/hooks/useClient";
import type { Queue } from '../api/types/queue';
import { formatPrice } from '../utils/formatPrice';
import useExport from '../api/hooks/useExport';
import type { Client } from '../api/types/client';

declare module '../api/types/queue' {
  interface Queue {
    clientFullName?: string;
    clientPhone?: string;
  }
}

const QueuePage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    const [queues, setQueues] = useState<Queue[]>([]);
    const { exportData, isExporting, exportProgress } = useExport<Queue, Client>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    
    const columnToApiSortMap: Record<number, string> = {
        0: 'positionInQueue',
        3: 'sum'
    };
    
    const { 
        isLoading, 
        error, 
        data: queueData, 
        getQueues,
        createQueue,
        closeQueue,
        deleteQueue
    } = useQueue();

    const { getClientById } = useClients();
    
    const loadQueues = useCallback(async () => {
        const params: any = {
            page: currentPage,
            pageSize,
            name: nameFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.descending = sortConfig.direction;
        }

        const queues = await getQueues(params);
                
        const queuesWithClients = await Promise.all(
            queues.items.map(async queue => {
                try {
                    const client = await getClientById(queue.clientId);
                    return {
                        ...queue,
                        clientFullName: client?.fullName,
                        clientPhone: client?.phone
                    };
                } catch (err) {
                    console.error('Ошибка при загрузке клиента:', err);
                    return queue;
                }
            })
        );
        
        setQueues(queuesWithClients);
        return queuesWithClients;
    }, [currentPage, nameFilter, sortConfig, getQueues, getClientById]);
    
    useEffect(() => {
        loadQueues();
    }, [currentPage, nameFilter, sortConfig, loadQueues]);

    const handleFilterChange = (value: string) => {
        setNameFilter(value);
        setCurrentPage(1);
    };

    const handleSort = (columnIndex: number) => {
        if (!columnToApiSortMap[columnIndex]) return;
        
        setSortConfig(prev => {
            if (prev.key === columnIndex) {
                return {
                    key: columnIndex,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                key: columnIndex,
                direction: 'asc'
            };
        });
    };

    const handleExport = async () => {
        try {
        await exportData({
            fetchData: async (page, pageSize) => {
            const params = {
                page,
                pageSize,
                name: nameFilter || undefined,
                sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
                sortDirection: sortConfig.direction
            };
            return await getQueues(params);
            },
            fetchAdditionalData: async (queue) => {
            try {
                return await getClientById(queue.clientId);
            } catch (err) {
                console.error('Ошибка при загрузке клиента:', err);
                return undefined;
            }
            },
            fileName: 'queues_export',
            transformData: (queue, client) => ({
            'Номер в очереди': queue.positionInQueue,
            'ФИО клиента': client?.fullName || queue.clientId.toString(),
            'Телефон клиента': client?.phone || '—',
            'Сумма': formatPrice(queue.sum.toString()),
            }),
            pageSize: 50
        });
        } catch (error) {
        console.error('Ошибка при экспорте:', error);
        }
    };

    const handleCreateQueue = () => {
        setModalMode('create');
        setSelectedQueue({
            id: 0,
            sum: 0,
            clientId: 0,
            priority: 0,
            positionInQueue: 0,
            createdAt: new Date()
        });
        setIsModalOpen(true);
    };

    const handleEditQueue = async (queue: Queue) => {
        try {
            const client = await getClientById(queue.clientId);
            setModalMode('edit');
            setSelectedQueue({
                ...queue,
                clientFullName: client?.fullName,
                clientPhone: client?.phone
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error('Ошибка при загрузке клиента:', err);
        }
    };

    const handleViewQueue = async (queue: Queue) => {
        try {
            const client = await getClientById(queue.clientId);
            setModalMode('view');
            setSelectedQueue({
                ...queue,
                clientFullName: client?.fullName,
                clientPhone: client?.phone
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error('Ошибка при загрузке клиента:', err);
        }
    };

    const handleDeleteQueue = async (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const queue = queues[rowIndex];
        
        if (window.confirm('Вы уверены, что хотите удалить эту запись из очереди?')) {
            try {
                await deleteQueue(queue.id);
                loadQueues();
            } catch (err) {
                console.error('Ошибка при удалении очереди:', err);
            }
        }
    };

    const handleCloseQueue = async (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const queue = queues[rowIndex];
        
        if (window.confirm('Вы уверены, что хотите закрыть эту запись в очереди?')) {
            try {
                await closeQueue(queue.id);
                loadQueues();
            } catch (err) {
                console.error('Ошибка при закрытии очереди:', err);
            }
        }
    };

    const handleSubmitQueue = async (queueData: Omit<Queue, 'id'>) => {
        try {
            if (modalMode === 'create') {
                await createQueue(queueData);
            }
            loadQueues();
        } catch (err) {
            console.error('Ошибка при сохранении очереди:', err);
        }
    };

    const handleRowDoubleClick = async (rowData: any[], rowIndex: number) => {
        const queue = queueData?.items[rowIndex];
        if (queue) {
            await handleViewQueue(queue);
        }
    };

    const tableData = queues.map((queue: Queue) => [
        queue.positionInQueue.toString(),
        queue.clientFullName || queue.clientId.toString(),
        queue.clientPhone || '—',
        formatPrice(queue.sum.toString()),
    ]);
    
    const tableActions = [
        {
            label: 'Закрыть',
            action: handleCloseQueue,
            color: '#007D88'
        },
        {
            label: 'Удалить',
            action: handleDeleteQueue,
            color: '#EF4444'
        }
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Очередь</CustomTitle>
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="fullname"
                    placeholder="ФИО клиента"
                    value={nameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <DarkCyanButton 
                    style={{ width: "15vw" }}
                    onClick={handleCreateQueue}
                >
                    + Новая очередь
                </DarkCyanButton>
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "Номер в очереди", isSortable: true },
                            { name: "ФИО клиента" },
                            { name: "Телефон клиента" },
                            { name: "Сумма", isSortable: true },
                        ]} 
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                        contextMenuActions={tableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={queueData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={queueData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            <QueueModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitQueue}
                initialData={selectedQueue || {
                    id: 0,
                    sum: 0,
                    clientId: 0,
                    priority: 0,
                    positionInQueue: 0,
                    createdAt: new Date(),
                    clientFullName: '',
                    clientPhone: ''
                }}
            />
        </PageLayout>
    );
};

export default QueuePage;