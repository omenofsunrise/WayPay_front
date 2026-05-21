import styled from 'styled-components';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import { setUiSettings, useUiSettings, type CreditsDisplayMode } from '../../utils/uiSettings';

const InterfacePage = () => {
    const settings = useUiSettings();

    const handleModeChange = (mode: CreditsDisplayMode) => {
        setUiSettings({ creditsDisplayMode: mode });
    };

    return (
        <PageLayout>
            <Section>
                <SectionTitle>Отображение договоров</SectionTitle>
                <SectionDescription>
                    Применяется к разделам «Договоры» и «Контроль договоров».
                </SectionDescription>

                <OptionsGroup>
                    <Option
                        $active={settings.creditsDisplayMode === 'pagination'}
                        onClick={() => handleModeChange('pagination')}
                    >
                        <OptionRadio $active={settings.creditsDisplayMode === 'pagination'} />
                        <OptionContent>
                            <OptionTitle>Постранично</OptionTitle>
                            <OptionDescription>
                                Договоры разбиваются на страницы «1, 2, 3…».
                            </OptionDescription>
                        </OptionContent>
                    </Option>

                    <Option
                        $active={settings.creditsDisplayMode === 'list'}
                        onClick={() => handleModeChange('list')}
                    >
                        <OptionRadio $active={settings.creditsDisplayMode === 'list'} />
                        <OptionContent>
                            <OptionTitle>Списком</OptionTitle>
                            <OptionDescription>
                                Договоры отображаются единым списком, новые порции
                                подгружаются автоматически при прокрутке.
                            </OptionDescription>
                        </OptionContent>
                    </Option>
                </OptionsGroup>
            </Section>
        </PageLayout>
    );
};

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 720px;
    color: #1f2937;
`;

const SectionTitle = styled.h2`
    font-size: 18px;
    font-weight: 600;
    margin: 0;
`;

const SectionDescription = styled.p`
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 12px;
`;

const OptionsGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Option = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
    background-color: ${({ $active }) => ($active ? 'rgba(0, 125, 136, 0.08)' : '#ffffff')};
    border: 1px solid ${({ $active }) => ($active ? 'rgba(0, 125, 136, 1)' : '#e5e7eb')};
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;

    &:hover {
        border-color: rgba(0, 125, 136, 1);
    }
`;

const OptionRadio = styled.span<{ $active: boolean }>`
    flex-shrink: 0;
    margin-top: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid ${({ $active }) => ($active ? 'rgba(0, 125, 136, 1)' : '#9ca3af')};
    position: relative;

    &::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background-color: rgba(0, 125, 136, 1);
        opacity: ${({ $active }) => ($active ? 1 : 0)};
        transition: opacity 0.2s ease;
    }
`;

const OptionContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const OptionTitle = styled.span`
    font-size: 15px;
    font-weight: 600;
    color: #111827;
`;

const OptionDescription = styled.span`
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
`;

export default InterfacePage;
