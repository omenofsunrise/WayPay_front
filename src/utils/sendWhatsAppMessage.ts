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

function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('8')) {
        return '7' + digits.slice(1);
    }
    
    return digits;
}