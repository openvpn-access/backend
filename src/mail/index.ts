import {createTransport, SentMessageInfo} from 'nodemailer';
import {Options} from 'nodemailer/lib/mailer';
import {config} from '../config';
import {resetPasswordTemplate} from './templates/reset-password';
import {verifyEmailTemplate} from './templates/verify-email';

const transporter = createTransport(config.email.transport);

export const sendMail = (opt: Omit<Options, 'from'>): Promise<SentMessageInfo> => {
    return transporter.sendMail({
        from: config.email.from,
        ...opt
    });
};

/**
 * Email-templates. They all take props and return HTML.
 */
export const emailTemplates = {
    verifyEmail: verifyEmailTemplate,
    resetPassword: resetPasswordTemplate
};
