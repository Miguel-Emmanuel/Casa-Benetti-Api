import {BindingScope, injectable} from '@loopback/core';
import sgMail from '@sendgrid/mail';

export const SendgridTemplates = {
  USER_RESET_PASSWORD: {
    id: 'd-5970cdbd1dc948a88ae9b1ba8af64507',
    subject: '¡Solicitud de cambio de contraseña!',
  },
  USER_PASSWORD_CHANGED: {
    id: 'd-6bba46eecad54dfb8529d75aca9b0f0c',
    subject: '¡Contraseña actualizada!',
  },
  NEW_USER: {
    id: 'd-3baf6b26baa041eab3ca8e8f1e321da1',
    subject: '¡Bienvenido a Casa Benetti!',
  },
  NEW_PROFORMA: {
    id: 'd-a0f920e2e6ea498289a59a3760175a9e',
    subject: 'Proforma agregada',
  },
  UPDATE_PROFORMA: {
    id: 'd-81dd06348c0e475b8f220232a6b9a67f',
    subject: 'Proforma actualizada',
  },
  NOTIFICATION_RESERVATION_DAY: {
    id: 'd-cb4feb384a774d05839b0e628534b9f8',
    subject: 'Notificación de apartado - Benetti Casa',
  }
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
