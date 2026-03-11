import * as db from '../db';
import { eventBus, AppEvents } from '../events/eventBus';
import { Paynow } from 'paynow';

export class PaymentService {
  private static getPaynow() {
    const integrationId = process.env.PAYNOW_INTEGRATION_ID;
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;
    const resultUrl = `${process.env.APP_URL}/api/payment/paynow-update`;
    const returnUrl = `${process.env.APP_URL}/?payment=success`;

    if (!integrationId || !integrationKey) {
      throw new Error("Paynow credentials not configured");
    }

    return new Paynow(integrationId, integrationKey, resultUrl, returnUrl);
  }

  static async initiatePaynow(data: { amount: number, claimId: string, email: string }) {
    const paynow = this.getPaynow();
    const payment = paynow.createPayment(data.claimId, data.email);
    payment.add(`AIMS Claim Settlement: ${data.claimId}`, data.amount);

    const response = await paynow.send(payment);

    if (response.success) {
      return {
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        reference: data.claimId
      };
    } else {
      throw new Error(response.error || "Failed to initiate Paynow transaction");
    }
  }

  static async checkPaynowStatus(pollUrl: string, claimId: string) {
    const paynow = this.getPaynow();
    const status = await paynow.pollTransaction(pollUrl);

    if (status.status === 'Paid' || status.status === 'Awaiting Delivery') {
      const updates = {
        insurancePaid: true,
        status: 'Settled',
        paymentDetails: {
          paynowReference: status.reference,
          paynowPaynowReference: status.paynowreference,
          amount: parseFloat(status.amount),
          timestamp: new Date().toISOString(),
          gateway: 'Paynow'
        }
      };

      const updated = await db.updateClaim(claimId, updates);
      if (updated) {
        eventBus.emit(AppEvents.PAYMENT_SUCCESS, { claimId, amount: updates.paymentDetails.amount, gateway: 'Paynow' });
      }
      return { status: "COMPLETED", updated };
    }
    
    return { status: status.status || 'FAILED', details: status };
  }
}
