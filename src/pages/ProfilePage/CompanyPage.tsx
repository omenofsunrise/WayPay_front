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
import { FiCamera, FiTrash2, FiEdit2 } from "react-icons/fi";
import BankCardSelect from "../../components/ui/fields/BankCardSelect";

const CompanyPage = () => {
    const { 
        company, 
        isLoading, 
        error, 
        getCompany, 
        updateCompany,
        updateCompanyPhoto,
        deleteCompanyPhoto,
        getCompanyPhotoUrl
    } = useCompany();
    
    const [formData, setFormData] = useState({
        name: "",
        chief: "",
        city: "",
        officeAddress: "",
        bank: "",
        phone: "",
        inn: "",
        email: "",
        currentBankCardId: null
    });
    
    const [currentBankCardId, setCurrentBankCardId] = useState<number | undefined>(undefined);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [displayBankCard, setDisplayBankCard] = useState("");

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
                email: company.email || "",
                currentBankCardId: company.currentBakkCardId || null
            });
            
            setCurrentBankCardId(company.currentBakkCardId || undefined);
            
            if (company.photoPath) {
                setPreviewUrl(getCompanyPhotoUrl(company.photoPath));
            } else {
                setPreviewUrl(null);
            }
        }
    }, [company, getCompanyPhotoUrl]);

    useEffect(() => {
        if (!selectedFile) return;
        
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBankCardChange = (value: string) => {
        console.log("Bank card details changed:", value);
    };

    const handleBankCardSelect = (bankCard: { id: number; details: string }) => {
        setCurrentBankCardId(bankCard.id);
        setFormData(prev => ({
            ...prev,
            currentBankCardId: bankCard.id
        }));
        setDisplayBankCard(bankCard.details);
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
                email: company.email || "",
                currentBankCardId: company.currentBakkCardId || null
            });
            setCurrentBankCardId(company.currentBakkCardId || undefined);
            setSelectedFile(null);
        }
    };

    const handleSave = async () => {
        try {
            const updateData = {
                ...formData,
                currentBankCardId: currentBankCardId
            };
            
            await updateCompany(updateData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await uploadLogo(file);
        }
    };

    const uploadLogo = async (file: File) => {
        setSelectedFile(file);
        setIsUploading(true);
        
        try {
            await updateCompanyPhoto(file);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            await getCompany();
        } catch (err) {
            console.error(err);
            setSelectedFile(null);
            setPreviewUrl(company?.photoPath ? getCompanyPhotoUrl(company.photoPath) : null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveLogo = async () => {
        try {
            await deleteCompanyPhoto();
            setPreviewUrl(null);
            setSelectedFile(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            await getCompany();
            setShowContextMenu(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        if (e.type === 'contextmenu') {
            e.preventDefault();
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
            return;
        }

        if (e.button === 0) {
            document.getElementById('logo-upload')?.click();
        }
    };

    const closeContextMenu = () => {
        setShowContextMenu(false);
    };

    if (isLoading && !company) {
        return <PageLayout>Loading...</PageLayout>;
    }

    if (error) {
        return <PageLayout>Error: {error}</PageLayout>;
    }

    return (
        <PageLayout>
            <HeaderWrapper>
                <TitleWrapper>
                    <CustomTitle style={{ marginTop: 0 }}>Данные о компании</CustomTitle>
                    <ModalInfoTitle>Сведения о компании</ModalInfoTitle>
                </TitleWrapper>
                
                <LogoContainer>
                    <LogoUploadWrapper>
                        <LogoPreview 
                            $hasLogo={!!previewUrl}
                            onClick={handleLogoClick}
                            onContextMenu={handleLogoClick}
                        >
                            {previewUrl ? (
                                <>
                                    <LogoImage src={previewUrl} alt="Company logo" />
                                    <EditOverlay>
                                        <FiEdit2 size={24} color="#fff" />
                                    </EditOverlay>
                                </>
                            ) : (
                                <CameraIcon />
                            )}
                        </LogoPreview>
                        
                        <input 
                            type="file" 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            id="logo-upload"
                            disabled={isUploading}
                        />
                    </LogoUploadWrapper>
                </LogoContainer>
            </HeaderWrapper>
            
            <ContentGrid>
                <FormSection>
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
                            <Label>Учредитель</Label>
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
                            <Label>Банк</Label>
                            <StyledInput 
                                name="bank"
                                value={formData.bank}
                                onChange={handleInputChange}
                            />
                        </InputGroup>
                        <InputGroup style={{width: "100%"}}>
                            <Label>Email</Label>
                            <StyledInput 
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </InputGroup>
                    </InputContainer>
                    
                    <InputContainer>
                        <InputGroup>
                            <Label>Текущая карточка</Label>
                            <BankCardSelect 
                                value={displayBankCard || formData.bank || ""}
                                onChange={handleBankCardChange}
                                onBankCardSelect={handleBankCardSelect}
                                placeholder="Выберите банковскую карту"
                            />
                        </InputGroup>
                        <InputGroup style={{width: "100%", maxWidth: "100%" }}>
                            <Label>Телефон</Label>
                            <PhoneModalInput 
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </InputGroup>
                    </InputContainer>
                                       
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
                </FormSection>
            </ContentGrid>
            
            <FooterContainer>
                <Disclaimer>
                    *Все данные компании используются только для автоматического оформления договора займа и не передаются третьим лицам.
                </Disclaimer>
            </FooterContainer>

            <Toast show={showSuccess}>
                Данные компании успешно сохранены!
            </Toast>

            {showContextMenu && (
                <>
                    <ContextMenuBackdrop onClick={closeContextMenu} />
                    <ContextMenu style={{ left: menuPosition.x - 200, top: menuPosition.y }}>
                        <ContextMenuItem onClick={() => {
                            document.getElementById('logo-upload')?.click();
                            closeContextMenu();
                        }}>
                            <FiEdit2 /> Изменить логотип
                        </ContextMenuItem>
                        <ContextMenuItem 
                            onClick={handleRemoveLogo}
                            $danger
                        >
                            <FiTrash2 /> Удалить логотип
                        </ContextMenuItem>
                    </ContextMenu>
                </>
            )}
        </PageLayout>
    );
};

const HeaderWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 24px;
    position: relative;
`;

const TitleWrapper = styled.div`
    flex: 1;
`;

const LogoContainer = styled.div`
    position: absolute;
    right: 0;
    top: 0;
`;

const LogoUploadWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
`;

const LogoPreview = styled.div<{ $hasLogo: boolean }>`
    width: 120px;
    height: 120px;
    border-radius: 8px;
    background-color: ${props => props.$hasLogo ? 'transparent' : '#f5f5f5'};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px dashed ${props => props.$hasLogo ? 'transparent' : '#ccc'};
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: #007d88;
        
        ${props => props.$hasLogo && `
            & > div:last-child {
                opacity: 1;
            }
        `}
    }
`;

const LogoImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const CameraIcon = styled(FiCamera)`
    font-size: 24px;
    color: #999;
`;

const EditOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
`;

const ContentGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    width: 100%;
`;

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

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

const ContextMenuBackdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
`;

const ContextMenu = styled.div`
    position: fixed;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    min-width: 160px;
    padding: 4px 0;
`;

const ContextMenuItem = styled.div<{ $danger?: boolean }>`
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: ${props => props.$danger ? '#ff4d4f' : '#333'};
    
    &:hover {
        background-color: #f5f5f5;
    }
    
    svg {
        font-size: 16px;
    }
`;

export default CompanyPage;