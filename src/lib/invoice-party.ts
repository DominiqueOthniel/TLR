import type { ParcelExpedition, ThirdParty, Trip } from '@/contexts/AppContext';

export interface InvoicePartyContact {
  telephone?: string;
  adresse?: string;
}

function findClientThirdParty(thirdParties: ThirdParty[], name: string): ThirdParty | undefined {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;
  return thirdParties.find(
    (tp) => tp.type === 'client' && tp.nom.trim().toLowerCase() === normalized,
  );
}

export function resolveInvoicePartyContact(
  thirdParties: ThirdParty[],
  opts: {
    trip?: Trip;
    expenseSupplier?: ThirdParty | null;
    parcelExpedition?: ParcelExpedition | null;
  },
): InvoicePartyContact {
  if (opts.expenseSupplier) {
    return {
      telephone: opts.expenseSupplier.telephone,
      adresse: opts.expenseSupplier.adresse,
    };
  }

  if (opts.trip?.client?.trim()) {
    const tp = findClientThirdParty(thirdParties, opts.trip.client);
    if (tp) {
      return { telephone: tp.telephone, adresse: tp.adresse };
    }
  }

  if (opts.parcelExpedition) {
    const names = [
      ...new Set(
        opts.parcelExpedition.lots
          .map((l) => l.clients?.trim())
          .filter(Boolean) as string[],
      ),
    ];
    const matched = names
      .map((name) => findClientThirdParty(thirdParties, name))
      .filter((tp): tp is ThirdParty => !!tp);

    if (matched.length === 1) {
      return { telephone: matched[0].telephone, adresse: matched[0].adresse };
    }
    if (matched.length > 1) {
      const telephones = [...new Set(matched.map((m) => m.telephone?.trim()).filter(Boolean) as string[])];
      const adresses = [...new Set(matched.map((m) => m.adresse?.trim()).filter(Boolean) as string[])];
      return {
        telephone: telephones.length ? telephones.join(' / ') : undefined,
        adresse: adresses.length ? adresses.join(' / ') : undefined,
      };
    }
  }

  return {};
}
