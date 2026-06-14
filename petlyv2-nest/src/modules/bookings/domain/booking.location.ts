export class BookingLocation {
  static normalize(value?: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[,\.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static isCompatible(a?: string, b?: string): boolean {
    const A = this.normalize(a);
    const B = this.normalize(b);

    if (!A || !B) return false;

    if (A === B) return true;

    // matching simples mas mais robusto
    return A.includes(B) || B.includes(A);
  }
}