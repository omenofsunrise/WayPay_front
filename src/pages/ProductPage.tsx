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
import { useState } from "react"
const ProductPage = () => {
    const [name, setName] = useState('');
    
    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Товары</CustomTitle>
                <ExportButton onClick={handleExport}></ExportButton>
            </TitleField>
            <FilterField>
                <CustomInput 
                    inputType="text"
                    placeholder="Название товара"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                />
                <DarkCyanButton style={{ width: "15vw" }}>+ Новый товар</DarkCyanButton>
            </FilterField>
            <CustomTable columns={[
                { name: "ID", isSortable: true },
                { name: "Название", isSortable: true },
                ]} 
                data={[
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ['2', 'Телефон'],
                ]}
            />
            <PaginationLayout>
                 <CountInfoTitle/>
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

export default ProductPage;