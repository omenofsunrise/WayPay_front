import scheduleService from '../api/services/scheduleService';
import companyService from '../api/services/companyService';

export const sendWhatsAppMessage = async (
    scheduleId: number, 
    phone: string, 
): Promise<boolean> => {
    try {
        // 1. Получаем данные компании
        const companyData = await companyService.getAccountDetails();
        
        if (!companyData) {
            console.error('Не удалось получить данные компании');
            return false;
        }

        // 2. Форматируем телефон
        const cleanedPhone = formatPhoneNumber(phone);
        
        // 3. Формируем сообщение
        const message = await companyService.getFilledSender(scheduleId);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
        
        // 4. Открываем WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // 5. Помечаем как уведомленное
        await scheduleService.markAsNotified(scheduleId);
        
        return true;
    } catch (error) {
        console.error('Ошибка при отправке WhatsApp:', error);
        return false;
    }
};

/**
 * Отправляет сообщение WhatsApp на конкретный номер телефона
 * @param phone - номер телефона получателя
 * @param message - текст сообщения
 * @returns boolean - успешность операции
 */
export const sendWhatsAppMessageToPhone = (phone: string, message: string): boolean => {
    try {
        // Форматируем телефон
        const cleanedPhone = formatPhoneNumber(phone);
        
        // Кодируем сообщение для URL
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
        
        // Открываем WhatsApp
        window.open(whatsappUrl, '_blank');
        
        return true;
    } catch (error) {
        console.error('Ошибка при отправке WhatsApp сообщения:', error);
        return false;
    }
};

/**
 * Создает URL для WhatsApp с предзаполненным сообщением, но без номера получателя
 * @param message - текст сообщения
 * @returns string - URL для открытия WhatsApp
 */
export const createWhatsAppMessageWithoutPhone = (message: string): string => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
};

/**
 * Отправка полностью кастомного сообщения через WhatsApp
 * @param phone - номер телефона получателя
 * @param message - произвольный текст сообщения
 * @param scheduleId - (опционально) ID расписания для отметки как уведомленного
 * @returns Promise<boolean> - успешность операции
 */
export const sendCustomWhatsAppMessage = async (
    phone: string,
    message: string
): Promise<boolean> => {
    try {
        // 1. Форматируем телефон
        const cleanedPhone = formatPhoneNumber(phone);
        
        // 2. Кодируем сообщение для URL
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
        
        // 3. Открываем WhatsApp
        window.open(whatsappUrl, '_blank');
        
        return true;
    } catch (error) {
        console.error('Ошибка при отправке кастомного WhatsApp сообщения:', error);
        return false;
    }
};

/**
 * Отправка кастомного сообщения с предварительной проверкой данных компании
 * @param phone - номер телефона получателя
 * @param message - произвольный текст сообщения
 * @param scheduleId - (опционально) ID расписания для отметки как уведомленного
 * @returns Promise<boolean> - успешность операции
 */
export const sendCustomWhatsAppMessageWithCompanyCheck = async (
    phone: string,
    message: string,
    scheduleId?: number
): Promise<boolean> => {
    try {
        // 1. Получаем данные компании для проверки доступности сервиса
        const companyData = await companyService.getAccountDetails();
        
        if (!companyData) {
            console.error('Не удалось получить данные компании');
            return false;
        }

        // 2. Используем основной метод отправки
        return await sendCustomWhatsAppMessage(phone, message);
        
    } catch (error) {
        console.error('Ошибка при отправке кастомного WhatsApp сообщения:', error);
        return false;
    }
};

function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('8')) {
        return '7' + digits.slice(1);
    }
    
    return digits;
}