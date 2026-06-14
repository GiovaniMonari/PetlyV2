export class BookingPricing {
  static calculateTotal(params: {
    startDate: Date;
    endDate: Date;
    pricePerDay: number;
  }) {
    const totalDays = Math.max(
      1,
      Math.ceil(
        (params.endDate.getTime() - params.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    return {
      totalDays,
      pricePerDay: params.pricePerDay,
      totalPrice: totalDays * params.pricePerDay,
    };
  }
}