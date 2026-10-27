import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Checkbox from "../ui/CheckBoxes/Checkbox";
import Tabs from "../ui/fields/Tabs";
import BaseModal from "./BASE/modalCRUBase";
import {
  getUiSettings,
  type PaymentColorRule,
  setUiSettings,
  type CreditsDisplayMode,
} from "../../utils/uiSettings";

interface SettingsModalProps {
  onClose: () => void;
}

export const HIDE_CURRENCY_KEY = "hideCurrencySymbol";
export const AUTO_COLLAPSE_MENU_KEY = "autoCollapseMenu";
export const DISABLE_NOTIFICATIONS_KEY = "disableNotifications";
export const SHOW_CONTRACT_CREATION_NOTIFICATION_KEY =
  "showContractCreationNotification";
export const DISABLE_WHATSAPP_NOTIFICATIONS_KEY =
  "disableWhatsAppNotifications";

export const getHideCurrencySetting = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(HIDE_CURRENCY_KEY);
  if (stored === null) return false;

  return stored === "true";
};

export const setHideCurrencySetting = (value: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(HIDE_CURRENCY_KEY, value.toString());
  }
};

export const getAutoCollapseMenuSetting = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(AUTO_COLLAPSE_MENU_KEY);
  if (stored === null) return false;

  return stored === "true";
};

export const setAutoCollapseMenuSetting = (value: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTO_COLLAPSE_MENU_KEY, value.toString());
  }
};

export const COLLAPSE_FILTERS_ON_CLICK_KEY = "collapseFiltersOnClick";

// Сворачивать панель фильтров при клике по рабочей области раздела.
export const getCollapseFiltersOnClickSetting = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(COLLAPSE_FILTERS_ON_CLICK_KEY);
  if (stored === null) return false;

  return stored === "true";
};

export const setCollapseFiltersOnClickSetting = (value: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(COLLAPSE_FILTERS_ON_CLICK_KEY, value.toString());
  }
};

export const getDisableNotificationsSetting = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(DISABLE_NOTIFICATIONS_KEY);
  if (stored === null) return false;

  return stored === "true";
};

export const useLocalStorageSetting = (key: string, defaultValue: boolean) => {
  const [value, setValue] = useState<boolean>(() =>
    getDisableNotificationsSetting()
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setValue(getDisableNotificationsSetting());
    };

    window.addEventListener("storage", handleStorageChange);

    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail.key === key) {
        setValue(getDisableNotificationsSetting());
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, [key]);

  return value;
};

export const setDisableNotificationsSetting = (value: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(DISABLE_NOTIFICATIONS_KEY, value.toString());
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: DISABLE_NOTIFICATIONS_KEY },
      })
    );
  }
};

export const getShowContractCreationNotificationSetting = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(SHOW_CONTRACT_CREATION_NOTIFICATION_KEY);
  if (stored === null) return true;

  return stored === "true";
};

export const setShowContractCreationNotificationSetting = (
  value: boolean
): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      SHOW_CONTRACT_CREATION_NOTIFICATION_KEY,
      value.toString()
    );
  }
};

export const getDisableWhatsAppNotificationsSetting = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(DISABLE_WHATSAPP_NOTIFICATIONS_KEY);
  if (stored === null) return false;

  return stored === "true";
};

export const setDisableWhatsAppNotificationsSetting = (
  value: boolean
): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(DISABLE_WHATSAPP_NOTIFICATIONS_KEY, value.toString());
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: DISABLE_WHATSAPP_NOTIFICATIONS_KEY },
      })
    );
  }
};

type SettingsTab = "interface" | "notifications";

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [hideCurrency, setHideCurrency] = useState(false);
  const [autoCollapseMenu, setAutoCollapseMenu] = useState(false);
  const [collapseFiltersOnClick, setCollapseFiltersOnClick] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);
  const [
    showContractCreationNotification,
    setShowContractCreationNotification,
  ] = useState(true);
  const [disableWhatsAppNotifications, setDisableWhatsAppNotifications] =
    useState(false);
  const [creditsDisplayMode, setCreditsDisplayMode] =
    useState<CreditsDisplayMode>("pagination");
  const [paymentsDisplayMode, setPaymentsDisplayMode] =
    useState<CreditsDisplayMode>("pagination");
  // Дни храним строкой, а не числом: иначе стёртое поле тут же становилось
  // нулём, и следующая цифра приписывалась к нему — «05» вместо «5».
  const [paymentColorRules, setPaymentColorRules] = useState<
    { days: string; color: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<SettingsTab>("interface");

  useEffect(() => {
    setHideCurrency(getHideCurrencySetting());
    setAutoCollapseMenu(getAutoCollapseMenuSetting());
    setCollapseFiltersOnClick(getCollapseFiltersOnClickSetting());
    setDisableNotifications(getDisableNotificationsSetting());
    setShowContractCreationNotification(
      getShowContractCreationNotificationSetting()
    );
    setDisableWhatsAppNotifications(getDisableWhatsAppNotificationsSetting());
    setCreditsDisplayMode(getUiSettings().creditsDisplayMode);
    setPaymentsDisplayMode(getUiSettings().paymentsDisplayMode);
    setPaymentColorRules(
      getUiSettings().paymentColorRules.map((rule) => ({
        days: String(rule.days),
        color: rule.color,
      }))
    );
  }, []);

  // Пустое поле дней — правило недозаполнено. Раньше оно молча пропадало при
  // сохранении, и человек не понимал, куда делось. Теперь не даём сохранить,
  // пока не вписал или не убрал.
  const hasIncompleteRule = paymentColorRules.some(
    (rule) => rule.days.trim() === ""
  );

  const handleSave = () => {
    setHideCurrencySetting(hideCurrency);
    setAutoCollapseMenuSetting(autoCollapseMenu);
    setCollapseFiltersOnClickSetting(collapseFiltersOnClick);
    setDisableNotificationsSetting(disableNotifications);
    setShowContractCreationNotificationSetting(
      showContractCreationNotification
    );
    setDisableWhatsAppNotificationsSetting(disableWhatsAppNotifications);
    setUiSettings({
      creditsDisplayMode,
      paymentsDisplayMode,
      // Пустые и повторяющиеся правила не храним: они только мешали бы
      // выбирать нужное.
      paymentColorRules: paymentColorRules
        // Пустое поле — правило не заполнили, его не сохраняем.
        .filter((rule) => rule.days.trim() !== "")
        .map(
          (rule): PaymentColorRule => ({
            color: rule.color,
            // Предел поля — год. Проверяем и здесь: число можно вписать
            // руками, минуя стрелки, и ограничение разметки не сработает.
            days: Math.min(Math.max(parseInt(rule.days, 10) || 0, 0), 365),
          })
        )
        .filter(
          (rule, i, all) =>
            all.findIndex((other) => other.days === rule.days) === i
        )
        .sort((a, b) => a.days - b.days),
    });
    onClose();
  };

  const tabs = [
    {
      id: "interface",
      label: "Интерфейс",
      content: (
        <SettingsSection>
          <Checkbox
            label="Скрыть знак рубля (₽) в интерфейсе"
            checked={hideCurrency}
            onChange={(e) => setHideCurrency(e)}
          />
          <Checkbox
            label="Сворачивать меню после выбора пункта"
            checked={autoCollapseMenu}
            onChange={(e) => setAutoCollapseMenu(e)}
          />
          <Checkbox
            label="Сворачивать панель фильтров (по Enter и клику в разделе)"
            checked={collapseFiltersOnClick}
            onChange={(e) => setCollapseFiltersOnClick(e)}
          />

          <SectionGroup>
            <SectionGroupTitle>Отображение договоров</SectionGroupTitle>
            <SectionGroupHint>
              Применяется к разделам «Договоры» и «Контроль договоров».
            </SectionGroupHint>

            <DisplayModeOption
              type="button"
              $active={creditsDisplayMode === "pagination"}
              onClick={() => setCreditsDisplayMode("pagination")}
            >
              <Radio $active={creditsDisplayMode === "pagination"} />
              <OptionText>
                <OptionTitle>Постранично</OptionTitle>
                <OptionHint>
                  Договоры разбиваются на страницы «1, 2, 3…».
                </OptionHint>
              </OptionText>
            </DisplayModeOption>

            <DisplayModeOption
              type="button"
              $active={creditsDisplayMode === "list"}
              onClick={() => setCreditsDisplayMode("list")}
            >
              <Radio $active={creditsDisplayMode === "list"} />
              <OptionText>
                <OptionTitle>Списком</OptionTitle>
                <OptionHint>
                  Единый список, новые порции подгружаются автоматически при
                  прокрутке.
                </OptionHint>
              </OptionText>
            </DisplayModeOption>
          </SectionGroup>

          <SectionGroup>
            <SectionGroupTitle>Отображение платежей</SectionGroupTitle>
            <SectionGroupHint>
              Применяется к разделу «Ожидаемые платежи».
            </SectionGroupHint>

            <DisplayModeOption
              type="button"
              $active={paymentsDisplayMode === "pagination"}
              onClick={() => setPaymentsDisplayMode("pagination")}
            >
              <Radio $active={paymentsDisplayMode === "pagination"} />
              <OptionText>
                <OptionTitle>Постранично</OptionTitle>
                <OptionHint>
                  Платежи разбиваются на страницы «1, 2, 3…».
                </OptionHint>
              </OptionText>
            </DisplayModeOption>

            <DisplayModeOption
              type="button"
              $active={paymentsDisplayMode === "list"}
              onClick={() => setPaymentsDisplayMode("list")}
            >
              <Radio $active={paymentsDisplayMode === "list"} />
              <OptionText>
                <OptionTitle>Списком</OptionTitle>
                <OptionHint>
                  Единый список, новые порции подгружаются автоматически при
                  прокрутке.
                </OptionHint>
              </OptionText>
            </DisplayModeOption>
          </SectionGroup>

          <SectionGroup>
            <SectionGroupTitle>Цвета ожидаемых платежей</SectionGroupTitle>

            {paymentColorRules.length === 0 && (
              <ColorRulesEmpty>
                Правил нет — платежи не закрашиваются.
              </ColorRulesEmpty>
            )}

            {paymentColorRules.map((rule, index) => (
              <ColorRuleRow key={index}>
                <ColorRuleLabel>За</ColorRuleLabel>
                <ColorRuleDays
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={rule.days}
                  onChange={(e) =>
                    setPaymentColorRules((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              // Оставляем только цифры и убираем ведущие нули,
                              // чтобы «05» не получалось в принципе.
                              days: e.target.value
                                .replace(/\D/g, "")
                                .replace(/^0+(?=\d)/, ""),
                            }
                          : item
                      )
                    )
                  }
                />
                <ColorRuleLabel>дн. — цвет</ColorRuleLabel>
                <ColorRuleColor
                  type="color"
                  value={rule.color}
                  onChange={(e) =>
                    setPaymentColorRules((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, color: e.target.value } : item
                      )
                    )
                  }
                />
                <ColorRuleRemove
                  type="button"
                  onClick={() =>
                    setPaymentColorRules((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  Убрать
                </ColorRuleRemove>
              </ColorRuleRow>
            ))}

            {hasIncompleteRule && (
              <ColorRulesWarning>
                Укажите количество дней — правило без него не сохранится.
              </ColorRulesWarning>
            )}

            <ColorRuleAdd
              type="button"
              onClick={() =>
                setPaymentColorRules((prev) => [
                  ...prev,
                  { days: "3", color: "#FFE6B0" },
                ])
              }
            >
              + Добавить правило
            </ColorRuleAdd>
          </SectionGroup>
        </SettingsSection>
      ),
    },
    {
      id: "notifications",
      label: "Уведомления",
      content: (
        <SettingsSection>
          <Checkbox
            label="Выключить уведомления"
            checked={disableNotifications}
            onChange={(e) => setDisableNotifications(e)}
          />
          <Checkbox
            label="Показывать уведомление при создании договора"
            checked={showContractCreationNotification}
            onChange={(e) => setShowContractCreationNotification(e)}
            disabled={disableNotifications}
          />
          <Checkbox
            label="Не присылать уведомления WhatsApp"
            checked={disableWhatsAppNotifications}
            onChange={(e) => setDisableWhatsAppNotifications(e)}
            disabled={disableNotifications}
          />
        </SettingsSection>
      ),
    },
  ];

  return (
    <BaseModal
      title="Персональные настройки"
      subtitle="Настройте отображение интерфейса и уведомления"
      appearance="compact-form"
      width="560px"
      maxHeight="calc(100vh - 32px)"
      onClose={onClose}
      onCancel={onClose}
      onSave={(event) => {
        event.preventDefault();
        handleSave();
      }}
      isSaveDisabled={hasIncompleteRule}
    >
      <ModalBody>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab as (tabId: string) => void}
        />
      </ModalBody>
    </BaseModal>
  );
};

const ColorRuleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #eef1f4;
  border-radius: 10px;
  background: #fbfcfd;
`;

const ColorRuleLabel = styled.span`
  color: #52606d;
  font-size: 13px;
  white-space: nowrap;
`;

const ColorRuleDays = styled.input`
  width: 64px;
  padding: 6px 8px;
  border: 1px solid #d6dce3;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
`;

const ColorRuleColor = styled.input`
  width: 44px;
  height: 32px;
  padding: 0;
  border: 1px solid #d6dce3;
  border-radius: 8px;
  background: none;
  cursor: pointer;
`;

const ColorRuleRemove = styled.button`
  margin-left: auto;
  border: none;
  background: none;
  color: #8a94a6;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: #d14343;
  }
`;

const ColorRuleAdd = styled.button`
  align-self: flex-end;
  border: 1px dashed #c4ccd6;
  background: none;
  border-radius: 10px;
  padding: 8px 14px;
  color: rgba(0, 125, 136, 1);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }
`;

const ColorRulesWarning = styled.p`
  margin: 0;
  color: #d14343;
  font-size: 13px;
`;

const ColorRulesEmpty = styled.p`
  margin: 0;
  color: #8a94a6;
  font-size: 13px;
`;

const ModalBody = styled.div`
  padding: 6px 34px 24px;
  text-align: left;
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SectionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const SectionGroupTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const SectionGroupHint = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const DisplayModeOption = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background-color: ${({ $active }) =>
    $active ? "rgba(0, 125, 136, 0.08)" : "#ffffff"};
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(0, 125, 136, 1)" : "#e5e7eb")};
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }
`;

const Radio = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  margin-top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid
    ${({ $active }) => ($active ? "rgba(0, 125, 136, 1)" : "#9ca3af")};
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background-color: rgba(0, 125, 136, 1);
    opacity: ${({ $active }) => ($active ? 1 : 0)};
    transition: opacity 0.15s ease;
  }
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OptionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const OptionHint = styled.span`
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
`;

export default SettingsModal;
