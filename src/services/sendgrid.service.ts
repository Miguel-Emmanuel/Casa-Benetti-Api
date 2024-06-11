import {BindingScope, injectable} from '@loopback/core';
import sgMail from '@sendgrid/mail';

export const SendgridTemplates = {
  USER_RESET_PASSWORD: {
    id: 'd-b0e5f8f91104447c8339178e04e410de',
    subject: '¡Solicitud de cambio de contraseña!',
  },
  USER_PASSWORD_CHANGED: {
    id: 'd-1be897d651474ee0add01bede2966359',
    subject: '¡Solicitud de cambio de contraseña!',
  },
  NEW_USER: {
    id: 'd-bdde2a6892874dfb91d3c073fcf80677',
    subject: '¡Bienvenido!',
  },
};

@injectable({scope: BindingScope.TRANSIENT})
export class SendgridService {
  constructor() { }

  async sendNotification(mailOptions: any) {

    if (process.env.SENDGRID_API_KEY !== undefined && mailOptions.templateId !== '') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      try {
        await sgMail.send({...mailOptions, from: process.env.SENDGRID_VERIFY_EMAIL});
        return true;
      } catch (e) {
        console.log('ERROR SENDING EMAIL: ', e.response.body.errors);
        return false;
      }
    }
    console.log('NO SENDGRID_API_KEY OR TEMPLATE_ID');
    return false;
  }
}

/*
 * Add service methods here
 */
