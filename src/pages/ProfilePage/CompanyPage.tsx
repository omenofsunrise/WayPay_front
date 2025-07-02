import { useEffect, useState } from "react";
import styled from "styled-components";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import ModalInfoTitle from "../../components/ui/Text/ModalInfoTitle";
import CustomInput from "../../components/ui/fields/CustomInput";
import GrayButton from "../../components/ui/Buttons/GrayButton";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import useCompany from "../../api/hooks/useCompany";
import PhoneModalInput from "../../components/ui/fields/PhoneModalInput";

const CompanyPage = () => {
    const { company, isLoading, error, getCompany, updateCompany } = useCompany();
    const [formData, setFormData] = useState({
        name: "",
        chief: "",
        city: "",
        officeAddress: "",
        bank: "",
        phone: "",
        inn: "",
        email: ""
    });
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        getCompany();
    }, [getCompany]);

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || "",
                chief: company.chief || "",
                city: company.city || "",
                officeAddress: company.officeAddress || "",
                bank: company.bank || "",
                phone: company.phone || "",
                inn: company.inn || "",
                email: company.email || ""
            });
        }
    }, [company]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleReset = () => {
        if (company) {
            setFormData({
                name: company.name || "",
                chief: company.chief || "",
                city: company.city || "",
                officeAddress: company.officeAddress || "",
                bank: company.bank || "",
                phone: company.phone || "",
                inn: company.inn || "",
                email: company.email || ""
            });
        }
    };

    const handleSave = async () => {
        try {
            await updateCompany(formData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
        }
    };

    if (isLoading && !company) {
        return <PageLayout>Loading...</PageLayout>;
    }

    if (error) {
        return <PageLayout>Error: {error}</PageLayout>;
    }

    return (
        <PageLayout>
            <CustomTitle style={{ marginTop: 0 }}>Данные о компании</CustomTitle>
            <ModalInfoTitle>Сведения о компании</ModalInfoTitle>
            <InputContainer>
                <InputGroup>
                    <Label>Название организации</Label>
                    <StyledInput 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                </InputGroup>
                <InputGroup>
                    <Label>В лице</Label>
                    <StyledInput 
                        name="chief"
                        inputType="fullname"
                        value={formData.chief}
                        onChange={handleInputChange}
                    />
                </InputGroup>
            </InputContainer>
            <InputContainer>
                <InputGroup>
                    <Label>Населённый пункт</Label>
                    <StyledInput 
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                    />
                </InputGroup>
                <InputGroup>
                    <Label>Адрес офиса</Label>
                    <StyledInput 
                        name="officeAddress"
                        value={formData.officeAddress}
                        onChange={handleInputChange}
                    />
                </InputGroup>
            </InputContainer>
            
            <InputContainer>
                <InputGroup>
                    <Label>ИНН</Label>
                    <StyledInput 
                        name="inn"
                        value={formData.inn}
                        onChange={handleInputChange}
                    />
                </InputGroup>
                <InputGroup>
                    <Label>Email</Label>
                    <StyledInput 
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </InputGroup>
            </InputContainer>
            
            <ThirdRowContainer>
                <HalfContainer>
                    <InputGroup>
                        <Label>Рассчётный счёт</Label>
                        <StyledInput 
                            name="bank"
                            value={formData.bank}
                            onChange={handleInputChange}
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Телефон</Label>
                        <PhoneModalInput 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                    </InputGroup>
                </HalfContainer>
                
                <ButtonsContainer>
                    <GrayButton 
                        children={"Сбросить"}
                        width={"120px"}
                        onClick={handleReset}
                    />
                    <DarkCyanButton 
                        onClick={handleSave}
                        disabled={isLoading}
                    />
                </ButtonsContainer>
            </ThirdRowContainer>
            
            <FooterContainer>
                <Disclaimer>
                    *Все данные компании используются только для автоматического оформления договора займа и не передаются третьим лицам.
                </Disclaimer>
            </FooterContainer>

            <Toast show={showSuccess}>
                Данные компании успешно сохранены!
            </Toast>
        </PageLayout>
    );
};

const Toast = styled.div<{ show: boolean }>`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 125, 136, 1);
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  z-index: 1000;
`;

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