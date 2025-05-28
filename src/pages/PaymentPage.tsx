import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton"
import ExportButton from "../components/ui/Buttons/ExportButton"
import CustomInput from "../components/ui/fields/CustomInput"
import Pagination from "../components/ui/fields/CustomPagination"
import CustomTable from "../components/ui/tables/CustomTable"
import FilterField from "../components/ui/Layouts/FilterField"
import PageLayout from "../components/ui/Layouts/PageLayout"
import PaginationLayout from "../components/ui/Layouts/PaginationLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CountInfoTitle from "../components/ui/Text/CountInfoTitle"
import CustomTitle from "../components/ui/Text/CustomTitle"
import { useState } from "react"
const PaymentPage = () => {
    const [name, setName] = useState('');
    
    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>История платежей</CustomTitle>
                <ExportButton onClick={handleExport}></ExportButton>
            </TitleField>
            <FilterField>
                <CustomInput 
                    inputType="fullname"
                    placeholder="ФИО"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                />
                <DarkCyanButton style={{ width: "15vw" }}>+ Новый платёж</DarkCyanButton>
            </FilterField>
            <CustomTable columns={[
                { name: "Договор №", isSortable: true },
                { name: "ФИО", isSortable: true },
                { name: "Платёж", isSortable: true },
                { name: "Дата платежа", isSortable: true },
                { name: "Тип платежа" },
                { name: "Платёж принял"},
                { name: "Подтверждён"},                
                ]} 
                data={[
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ['2', 'Демьянов Владимир Архангел', '1 000', '12.05.2023', 'Наличными', 'Себостьян Сергей', 'Да'],
                ]}
            />
            <PaginationLayout>
                    <Pagination
                    total={100} 
                />
            </PaginationLayout>
        </PageLayout>
    )
}

const handleExport = () => {
    console.log('Экспорт данных');
};

export default PaymentPage;