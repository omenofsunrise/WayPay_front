import scheduleService from '../api/services/scheduleService';
import companyService from '../api/services/companyService';

const sanitizeForUrl = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
        .replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '$1')
        .replace(/\r\n?/g, '\n');
};

const encodeWhatsAppText = (text: string): string => {
    const safeText = sanitizeForUrl(text);
    return encodeURIComponent(safeText).replace(
        /[!'()*]/g,
        c => '%' + c.charCodeAt(0).toString(16).toUpperCase()
    );
};

const buildWhatsAppUrl = (phone: string | null | undefined, message: string): string => {
    const encodedText = encodeWhatsAppText(message);
    return `https://wa.me/${phone ?? ''}?text=${encodedText}`;
};

export const sendWhatsAppMessage = async (
    scheduleId: number,
    phone: string,
): Promise<boolean> => {
    try {
        const companyData = await companyService.getAccountDetails();

        if (!companyData) {
            console.error('Не удалось получить данные компании');
            return false;
        }

        const cleanedPhone = formatPhoneNumber(phone);
        const message = await companyService.getFilledSender(scheduleId);
        const whatsappUrl = buildWhatsAppUrl(cleanedPhone, message);

        window.open(whatsappUrl, '_blank');

        await scheduleService.markAsNotified(scheduleId);

        return true;
    } catch (error) {
        console.error('Ошибка при отправке WhatsApp:', error);
        return false;
    }
};

export const sendWhatsAppMessageToPhone = (phone: string, message: string): boolean => {
    try {
        const cleanedPhone = formatPhoneNumber(phone);
        const whatsappUrl = buildWhatsAppUrl(cleanedPhone, message);

        window.open(whatsappUrl, '_blank');

        return true;
    } catch (error) {
        console.error('Ошибка при отправке WhatsApp сообщения:', error);
        return false;
    }
};

export const createWhatsAppMessageWithoutPhone = (message: string): string => {
    return buildWhatsAppUrl(null, message);
};

export const sendCustomWhatsAppMessage = async (
    phone: string,
    message: string
): Promise<boolean> => {
    try {
        const cleanedPhone = formatPhoneNumber(phone);
        const whatsappUrl = buildWhatsAppUrl(cleanedPhone, message);

        window.open(whatsappUrl, '_blank');

        return true;
    } catch (error) {
        console.error('Ошибка при отправке кастомного WhatsApp сообщения:', error);
        return false;
    }
};

export const sendCustomWhatsAppMessageWithCompanyCheck = async (
    phone: string,
    message: string,
    scheduleId?: number
): Promise<boolean> => {
    try {
        const companyData = await companyService.getAccountDetails();

        if (!companyData) {
            console.error('Не удалось получить данные компании');
            return false;
        }

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
