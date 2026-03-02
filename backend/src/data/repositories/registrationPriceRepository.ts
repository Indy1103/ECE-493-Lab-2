export interface RegistrationPriceRow {
  id: string;
  attendanceType: string;
  amount: number;
  currency: string;
}

export interface RegistrationPriceListRow {
  id: string;
  title: string;
  status: "PUBLISHED";
  publishedAt: Date;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  prices: RegistrationPriceRow[];
}

export interface RegistrationPriceRepository {
  getPublishedPriceList(): Promise<RegistrationPriceListRow | null>;
}

interface PrismaPriceRecord {
  id: string;
  attendanceType: string;
  amount: number | { toNumber(): number };
  currency: string;
}

interface PrismaPriceListRecord {
  id: string;
  title: string;
  status: "PUBLISHED";
  publishedAt: Date;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  prices: PrismaPriceRecord[];
}

interface PrismaClientLike {
  registrationPriceList: {
    findFirst(args: Record<string, unknown>): Promise<PrismaPriceListRecord | null>;
  };
}

function asNumber(amount: number | { toNumber(): number }): number {
  if (typeof amount === "number") {
    return amount;
  }

  return amount.toNumber();
}

export class PrismaRegistrationPriceRepository implements RegistrationPriceRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  async getPublishedPriceList(): Promise<RegistrationPriceListRow | null> {
    const row = await this.prisma.registrationPriceList.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        prices: {
          orderBy: { attendanceType: "asc" }
        }
      }
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      status: row.status,
      publishedAt: row.publishedAt,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      prices: row.prices.map((price) => ({
        id: price.id,
        attendanceType: price.attendanceType,
        amount: asNumber(price.amount),
        currency: price.currency
      }))
    };
  }
}

export class InMemoryRegistrationPriceRepository
  implements RegistrationPriceRepository
{
  private publishedPriceList: RegistrationPriceListRow | null = null;
  private forceFailure = false;

  setPublishedPriceList(priceList: RegistrationPriceListRow | null): void {
    this.publishedPriceList = priceList;
  }

  setForceFailure(enabled: boolean): void {
    this.forceFailure = enabled;
  }

  async getPublishedPriceList(): Promise<RegistrationPriceListRow | null> {
    if (this.forceFailure) {
      throw new Error("repository unavailable");
    }

    if (!this.publishedPriceList) {
      return null;
    }

    return structuredClone(this.publishedPriceList);
  }
}
