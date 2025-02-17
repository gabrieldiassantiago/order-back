import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import fetch from 'node-fetch';
import 'dotenv/config';

@Injectable()
export class HealthCheckService {
    private readonly logger = new Logger(HealthCheckService.name);

    constructor() {
        this.scheduleHealthCheck();
    }

    private scheduleHealthCheck() {
        cron.schedule('*/14 * * * *', () => {
            this.logger.log('Checking API health');
            this.checkHealth();
        });
    }

    private async checkHealth() {
        const apiUrl = 'https://order-back-1.onrender.com/health';
        try {
            const response = await fetch(apiUrl);
            if (response.status === 200) {
                this.logger.log('API is healthy');
            } else {
                this.logger.error('API is unhealthy');
            }
        } catch (error) {
            this.logger.error('Error checking API health', error);
        }
    }
}
