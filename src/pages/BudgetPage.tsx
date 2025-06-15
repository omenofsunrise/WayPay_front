import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton"
import CustomInput from "../components/ui/fields/CustomInput"
import FilterField from "../components/ui/Layouts/FilterField"
import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CustomTitle from "../components/ui/Text/CustomTitle"

const BudgetPage = () => {
    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Бюджет</CustomTitle>
            </TitleField>

            <FilterField>
                <CustomInput 
                    inputType="text"
                    placeholder="Название товара"
                />
                <DarkCyanButton 
                    style={{ width: "15vw" }}
                >
                    + Добавить
                </DarkCyanButton>
            </FilterField>
            
        </PageLayout>
    )
}

export default BudgetPage;