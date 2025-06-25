import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout"
import CustomTitle from "../components/ui/Text/CustomTitle"

const PaymentsIncomePage = () => {
    return(
        <PageLayout>
            <TitleField>
                <CustomTitle>Доход от платежей</CustomTitle>
            </TitleField>
        </PageLayout>
    )
}

export default PaymentsIncomePage;