import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import ModalInfoTitle from "../../components/ui/Text/ModalInfoTitle";
import CustomInput from "../../components/ui/fields/CustomInput";
import GrayButton from "../../components/ui/Buttons/GrayButton";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";

const CompanyPage = () => {
    return (
        <PageLayout>
            <CustomTitle style={{ marginTop: 0 }}>Данные о компании</CustomTitle>
            <ModalInfoTitle>Сведения о компании</ModalInfoTitle>
            <InputContainer>
                <InputGroup>
                    <Label>Название организации</Label>
                    <StyledInput />
                </InputGroup>
                <InputGroup>
                    <Label>В лице</Label>
                    <StyledInput />
                </InputGroup>
            </InputContainer>
            <InputContainer>
                <InputGroup>
                    <Label>Населённый пункт</Label>
                    <StyledInput />
                </InputGroup>
                <InputGroup>
                    <Label>Адрес офиса</Label>
                    <StyledInput />
                </InputGroup>
            </InputContainer>
            
            <ThirdRowContainer>
                <HalfContainer>
                    <InputGroup>
                        <Label>Банковские данные</Label>
                        <StyledInput />
                    </InputGroup>
                    <InputGroup>
                        <Label>Телефон</Label>
                        <StyledInput />
                    </InputGroup>
                </HalfContainer>
                
                <ButtonsContainer>
                    <GrayButton 
                        children={"Сбросить"}
                        width={"120px"}
                    />
                    <DarkCyanButton />
                </ButtonsContainer>
            </ThirdRowContainer>
            
            <FooterContainer>
                <Disclaimer>
                    *Все данные компании используются только для автоматического оформления договора займа и не передаются третьим лицам.
                </Disclaimer>
            </FooterContainer>
        </PageLayout>
    );
};

const InputContainer = styled.div`
    display: flex;
    gap: 16px;
    width: 100%;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 8px;
`;

const Label = styled.span`
    font-size: 14px;
    color: #333;
    text-align: left;
    margin-top: 10px;
`;

const StyledInput = styled(CustomInput)`
    max-width: 100%;
`;

const HalfContainer = styled.div`
    width: calc(50% - 8px);
    display: flex;
    gap: 16px;
`;

const ThirdRowContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 32px;
    margin-top: 32px;
`;

const FooterContainer = styled.div`
    margin-top: 24px;
    margin-right: auto;

`;

const Disclaimer = styled.span`
    font-size: 16px;
    color: black;
    max-width: 300px;
    text-align: left;
`;

export default CompanyPage;