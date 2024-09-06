import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import dayjs from 'dayjs';
import {SendgridServiceBindings} from '../keys';
import {QuotationProductsStockRepository} from '../repositories';
import {SendgridService, SendgridTemplates} from '../services';

@cronJob()
export class ResertvationDayCronJob extends CronJob {
	constructor(
		@inject(SendgridServiceBindings.SENDGRID_SERVICE)
		public sendgridService: SendgridService,
		// @repository(QuotationProductsRepository)
		// public quotationProductsRepository: QuotationProductsRepository,
		@repository(QuotationProductsStockRepository)
		public quotationProductsStockRepository: QuotationProductsStockRepository,
	) {
		super({
			name: 'cron-job',
			onTick: async () => {
				await this.notifyCustomer();
			},
			// cronTime: '*/5 * * * * *',
			cronTime: '0 7 * * *',
			start: true,
			timeZone: 'America/Mexico_City',
		});
	}

	async notifyCustomer() {
		console.log('ResertvationDayCronJob');
		const lastDay = dayjs();
		const startDay = lastDay.startOf('day').toDate();
		const endDay = lastDay.endOf('day').toDate();
		const quotationProducts = await this.quotationProductsStockRepository.find({
			where: {
				and: [
					{
						dateReservationDays: {
							gte: startDay,
						},
					},
					{
						dateReservationDays: {
							lte: endDay,
						},
					},
					{
						or: [
							{
								isNotificationSent: false,
							},
							{
								isNotificationSent: {eq: null},
							},
						],
					},
				],
			},
			include: [
				{
					relation: 'quotation',
					scope: {
						fields: ['id', 'customerId'],
						include: [
							{
								relation: 'customer',
								scope: {
									fields: ['id', 'name', 'lastName', 'secondLastName'],
								},
							},
						],
					},
				},
				{
					relation: 'quotationProducts',
					scope: {
						include: [
							{
								relation: 'product',
							},
						],
					},
				},
			],
			fields: ['id', 'quotationId', 'reservationDays', 'dateReservationDays'],
		});
		for (const quotationProduct of quotationProducts) {
			const {quotation, dateReservationDays, quotationProducts} = quotationProduct;
			const {product} = quotationProducts
			const {customer} = quotation;
			const email = customer?.email;
			if (email) {
				const options = {
					to: email,
					templateId: SendgridTemplates.NOTIFICATION_RESERVATION_DAY.id,
					dynamicTemplateData: {
						subject: SendgridTemplates.NOTIFICATION_RESERVATION_DAY.subject,
						customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
						productName: `${product?.name}`,
						dateReservationDays:
							dayjs(dateReservationDays).format('DD/MM/YYYY'),
					},
				};
				await this.sendgridService.sendNotification(options);
				await this.quotationProductsStockRepository.updateById(
					quotationProduct?.id,
					{isNotificationSent: true},
				);
			}
		}
	}
}
