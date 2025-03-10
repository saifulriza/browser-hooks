export interface PaymentRequestOptions {
  methods: PaymentMethodData[];
  details: PaymentDetailsInit;
  options?: PaymentOptions;
}

export function usePaymentRequest() {
  const createPaymentRequest = (options: PaymentRequestOptions) => {
    try {
      const request = new PaymentRequest(
        options.methods,
        options.details,
        options.options
      );
      return request;
    } catch (error) {
      throw new Error(`Failed to create PaymentRequest: ${error}`);
    }
  };

  const show = async (request: PaymentRequest) => {
    try {
      const response = await request.show();
      return response;
    } catch (error) {
      throw new Error(`Payment request failed: ${error}`);
    }
  };

  const canMakePayment = async (request: PaymentRequest) => {
    try {
      return await request.canMakePayment();
    } catch (error) {
      return false;
    }
  };

  return {
    createPaymentRequest,
    show,
    canMakePayment
  };
}