import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton"
import ExportButton from "../components/ui/Buttons/ExportButton"
import CustomInput from "../components/ui/fields/CustomInput"
import Pagination from "../components/ui/fields/CustomPagination"
import CustomTable from "../components/ui/fields/CustomTable"
import FilterField from "../components/ui/Layouts/FilterField"
import PageLayout from "../components/ui/Layouts/PageLayout"
import PaginationLayout from "../components/ui/Layouts/PaginationLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CountInfoTitle from "../components/ui/Text/CountInfoTitle"
import CustomTitle from "../components/ui/Text/CustomTitle"
import { exportToExcel } from '../utils/exportUtils';
import { useEffect, useState, useCallback } from "react"

import useQueue from "../api/hooks/useQueue"

const QueuePage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    
    const { 
        isLoading, 
        error, 
        data: queueData, 
        getQueues 
    } = useQueue();
    
    const loadQueues = useCallback(async () => {
        await getQueues({
            page: currentPage,
            pageSize,
            name: nameFilter || undefined
        });
    }, [currentPage, nameFilter, getQueues]);
    
    useEffect(() => {
        loadQueues();
    }, [currentPage, loadQueues]);

    const handleExport = async () => {
        try {
            const allQueues = await getQueues({
            name: nameFilter || undefined,
            pageSize: 100
            });
            
            if (allQueues?.items) {
            exportToExcel(allQueues.items.map(queue => ({
                'ID': queue.id,
            })), {
                fileName: 'queue_export',
                sheetName: 'Queue',
                columnWidths: [10, 30]
            });
            }
        } catch (err) {
            console.error('Ошибка при экспорте:', err);
        }
    };

    const tableData = queueData?.items.map(queue => [
        queue.positionInQueue,
        queue.id.toString(),
        queue.id.toString(),
        queue.sum
    ]) || [];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Очередь</CustomTitle>
                <ExportButton onClick={handleExport} />
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="fullname"
                    placeholder="ФИО"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                />
                <DarkCyanButton style={{ width: "15vw" }}>
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
                            { name: "ФИО", isSortable: true },
                            { name: "Телефон" },
                            { name: "Сумма", isSortable: true }
                        ]} 
                        data={tableData}
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
        </PageLayout>
    )
}

export default QueuePage;