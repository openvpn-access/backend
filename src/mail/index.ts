import {createTransport, SentMessageInfo} from 'nodemailer';
import {Options} from 'nodemailer/lib/mailer';
import {config} from '../config';

const transporter = createTransport(config.email.transport);

// TODO: EJS templates?
export const sendMail = (opt: Omit<Options, 'from'>): Promise<SentMessageInfo> => {
    return transporter.sendMail({
        from: config.email.from,
        ...opt
    });
};
