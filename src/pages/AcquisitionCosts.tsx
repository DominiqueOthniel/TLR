import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  FileDown,
  FileText,
  Filter,
  PackageCheck,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  WalletCards,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp, Expense } from '@/contexts/AppContext';
import { exportToExcel, exportToPrintablePDF } from '@/lib/export-utils';
import { EMOJI } from '@/lib/emoji-palette';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AcquisitionSort = 'date_desc' | 'date_asc' | 'montant_desc' | 'montant_asc' | 'categorie_asc';

const ACQUISITION_SORT_OPTIONS: Array<{ value: AcquisitionSort; label: string }> = [
  { value: 'date_desc', label: 'Plus récent d’abord' },
  { value: 'date_asc', label: 'Plus ancien d’abord' },
  { value: 'montant_desc', label: 'Montant élevé d’abord' },
  { value: 'montant_asc', label: 'Montant faible d’abord' },
  { value: 'categorie_asc', label: 'Catégorie A → Z' },
];

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
}

function getMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export default function AcquisitionCosts() {
  const navigate = useNavigate();
  const { expenses, trucks, drivers, thirdParties } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterFournisseur, setFilterFournisseur] = useState('all');
  const [filterCamion, setFilterCamion] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState<AcquisitionSort>('date_desc');

  const getTruckLabel = (id?: string) => {
    if (!id) return 'Non lié à un camion';
    const truck = trucks.find((item) => item.id === id);
    return truck ? `${truck.immatriculation}${truck.modele ? ` · ${truck.modele}` : ''}` : 'Camion introuvable';
  };

  const getDriverLabel = (id?: string) => {
    if (!id) return '';
    const driver = drivers.find((item) => item.id === id);
    return driver ? `${driver.prenom} ${driver.nom}` : '';
  };

  const getSupplierLabel = (id?: string) => {
    if (!id) return 'Aucun fournisseur';
    return thirdParties.find((item) => item.id === id)?.nom || 'Fournisseur introuvable';
  };

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((expense) => expense.categorie).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr')),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (filterCategorie !== 'all' && expense.categorie !== filterCategorie) return false;
      if (filterFournisseur !== 'all') {
        if (filterFournisseur === 'none' && expense.fournisseurId) return false;
        if (filterFournisseur !== 'none' && expense.fournisseurId !== filterFournisseur) return false;
      }
      if (filterCamion !== 'all') {
        if (filterCamion === 'none' && expense.camionId) return false;
        if (filterCamion !== 'none' && expense.camionId !== filterCamion) return false;
      }
      if (filterDateFrom && expense.date < filterDateFrom) return false;
      if (filterDateTo && expense.date > filterDateTo) return false;

      if (!search) return true;

      const haystack = [
        expense.description,
        expense.categorie,
        expense.sousCategorie,
        getTruckLabel(expense.camionId),
        getSupplierLabel(expense.fournisseurId),
        getDriverLabel(expense.chauffeurId),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [expenses, filterCamion, filterCategorie, filterDateFrom, filterDateTo, filterFournisseur, searchTerm]);

  const sortedExpenses = useMemo(() => {
    const list = [...filteredExpenses];
    switch (sortBy) {
      case 'date_asc':
        return list.sort((a, b) => a.date.localeCompare(b.date));
      case 'montant_desc':
        return list.sort((a, b) => b.montant - a.montant);
      case 'montant_asc':
        return list.sort((a, b) => a.montant - b.montant);
      case 'categorie_asc':
        return list.sort((a, b) => a.categorie.localeCompare(b.categorie, 'fr'));
      case 'date_desc':
      default:
        return list.sort((a, b) => b.date.localeCompare(a.date));
    }
  }, [filteredExpenses, sortBy]);

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.montant, 0);
  const currentMonth = getMonthKey();
  const currentMonthAmount = filteredExpenses
    .filter((expense) => expense.date.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.montant, 0);
  const suppliersCount = new Set(filteredExpenses.map((expense) => expense.fournisseurId).filter(Boolean)).size;
  const averageAmount = filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length) : 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { categorie: string; montant: number; count: number }>();
    for (const expense of filteredExpenses) {
      const current = map.get(expense.categorie) || { categorie: expense.categorie, montant: 0, count: 0 };
      current.montant += expense.montant;
      current.count += 1;
      map.set(expense.categorie, current);
    }
    return Array.from(map.values()).sort((a, b) => b.montant - a.montant);
  }, [filteredExpenses]);

  const topCategory = categoryBreakdown[0];

  const filtersDescription = useMemo(() => {
    const filters: string[] = [];
    if (searchTerm) filters.push(`Recherche: "${searchTerm}"`);
    if (filterCategorie !== 'all') filters.push(`Catégorie: ${filterCategorie}`);
    if (filterFournisseur !== 'all') filters.push(`Fournisseur: ${filterFournisseur === 'none' ? 'Aucun' : getSupplierLabel(filterFournisseur)}`);
    if (filterCamion !== 'all') filters.push(`Camion: ${filterCamion === 'none' ? 'Aucun' : getTruckLabel(filterCamion)}`);
    if (filterDateFrom) filters.push(`Du: ${formatDate(filterDateFrom)}`);
    if (filterDateTo) filters.push(`Au: ${formatDate(filterDateTo)}`);
    return filters.length ? filters.join(' · ') : 'Toutes les dépenses et achats enregistrés';
  }, [filterCamion, filterCategorie, filterDateFrom, filterDateTo, filterFournisseur, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategorie('all');
    setFilterFournisseur('all');
    setFilterCamion('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSortBy('date_desc');
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: 'Frais d’acquisition',
      fileName: `frais_acquisition_${new Date().toISOString().split('T')[0]}.xlsx`,
      filtersDescription,
      columns: [
        { header: 'Date', value: (expense: Expense) => formatDate(expense.date) },
        { header: 'Catégorie', value: (expense: Expense) => expense.categorie },
        { header: 'Sous-catégorie', value: (expense: Expense) => expense.sousCategorie || '-' },
        { header: 'Description', value: (expense: Expense) => expense.description },
        { header: 'Fournisseur', value: (expense: Expense) => getSupplierLabel(expense.fournisseurId) },
        { header: 'Camion', value: (expense: Expense) => getTruckLabel(expense.camionId) },
        { header: 'Chauffeur', value: (expense: Expense) => getDriverLabel(expense.chauffeurId) || '-' },
        { header: 'Montant (FCFA)', value: (expense: Expense) => expense.montant },
      ],
      rows: sortedExpenses,
    });
    toast.success('Export Excel des frais d’acquisition généré');
  };

  const handleExportPDF = () => {
    exportToPrintablePDF({
      title: 'Frais d’acquisition',
      fileName: `frais_acquisition_${new Date().toISOString().split('T')[0]}.pdf`,
      filtersDescription,
      headerColor: '#1e3a8a',
      headerTextColor: '#ffffff',
      evenRowColor: '#f8fafc',
      oddRowColor: '#ffffff',
      accentColor: '#7a1f2b',
      totals: [
        { label: 'Total suivi', value: formatMoney(totalAmount), style: 'negative', icon: EMOJI.depense },
        { label: 'Opérations', value: filteredExpenses.length, style: 'neutral', icon: EMOJI.facture },
        { label: 'Mois en cours', value: formatMoney(currentMonthAmount), style: 'neutral', icon: EMOJI.calendrier },
        { label: 'Panier moyen', value: formatMoney(averageAmount), style: 'neutral', icon: EMOJI.argent },
      ],
      columns: [
        { header: 'Date', value: (expense: Expense) => formatDate(expense.date) },
        { header: 'Poste', value: (expense: Expense) => `${expense.categorie}${expense.sousCategorie ? ` · ${expense.sousCategorie}` : ''}` },
        { header: 'Description', value: (expense: Expense) => expense.description },
        { header: 'Fournisseur', value: (expense: Expense) => getSupplierLabel(expense.fournisseurId) },
        { header: 'Camion', value: (expense: Expense) => getTruckLabel(expense.camionId) },
        { header: 'Montant', value: (expense: Expense) => formatMoney(expense.montant), cellStyle: () => 'negative' },
      ],
      rows: sortedExpenses,
    });
  };

  const hasActiveFilters =
    searchTerm ||
    filterCategorie !== 'all' ||
    filterFournisseur !== 'all' ||
    filterCamion !== 'all' ||
    filterDateFrom ||
    filterDateTo ||
    sortBy !== 'date_desc';

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        title="Frais d’acquisition"
        description="Un tableau de bord simple pour retracer les achats, dépenses et postes qui pèsent sur l’activité."
        icon={ShoppingCart}
        gradient="from-teal-500/20 via-emerald-500/10 to-transparent"
        iconColor="from-teal-600 via-emerald-600 to-cyan-700"
        stats={[
          {
            label: 'Total suivi',
            value: formatMoney(totalAmount),
            icon: <WalletCards className="h-4 w-4" />,
            color: 'text-teal-700 dark:text-teal-300',
          },
          {
            label: 'Opérations',
            value: filteredExpenses.length,
            icon: <Receipt className="h-4 w-4" />,
            color: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Ce mois',
            value: formatMoney(currentMonthAmount),
            icon: <CalendarDays className="h-4 w-4" />,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Panier moyen',
            value: formatMoney(averageAmount),
            icon: <PackageCheck className="h-4 w-4" />,
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Poste principal',
            value: topCategory ? topCategory.categorie : '-',
            icon: <Tag className="h-4 w-4" />,
            color: 'text-purple-600 dark:text-purple-400',
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button onClick={() => navigate('/depenses')}>
              <Plus className="mr-2 h-4 w-4" />
              Enregistrer une dépense
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border-teal-200/60 shadow-sm dark:border-teal-900/40">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-teal-600" />
              Recherche rapide
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="mr-1.5 h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <Label htmlFor="acquisition-search" className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Chercher un achat, un fournisseur, un camion ou une note
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="acquisition-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ex: carburant, pneus, vidange, AXA, LT-123..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div>
              <Label>Catégorie</Label>
              <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((categorie) => (
                    <SelectItem key={categorie} value={categorie}>
                      {categorie}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fournisseur</Label>
              <Select value={filterFournisseur} onValueChange={setFilterFournisseur}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  <SelectItem value="none">Sans fournisseur</SelectItem>
                  {thirdParties
                    .filter((item) => item.type === 'fournisseur')
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Camion</Label>
              <Select value={filterCamion} onValueChange={setFilterCamion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les camions</SelectItem>
                  <SelectItem value="none">Sans camion</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.immatriculation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acq-from">Du</Label>
              <Input id="acq-from" type="date" value={filterDateFrom} onChange={(event) => setFilterDateFrom(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="acq-to">Au</Label>
              <Input id="acq-to" type="date" value={filterDateTo} onChange={(event) => setFilterDateTo(event.target.value)} />
            </div>
            <div>
              <Label>Tri</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as AcquisitionSort)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACQUISITION_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Répartition par poste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">Aucune dépense à répartir pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((item) => {
                  const pct = totalAmount > 0 ? Math.round((item.montant / totalAmount) * 100) : 0;
                  return (
                    <div key={item.categorie} className="rounded-xl border bg-background p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.categorie}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} opération{item.count > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-teal-700 dark:text-teal-300">{formatMoney(item.montant)}</p>
                          <p className="text-xs text-muted-foreground">{pct}% du total</p>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              Lecture rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-background/50">
              <p className="text-sm text-muted-foreground">Fournisseurs touchés</p>
              <p className="mt-1 text-2xl font-bold">{suppliersCount}</p>
            </div>
            <div className="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-background/50">
              <p className="text-sm text-muted-foreground">Plus gros poste</p>
              <p className="mt-1 text-lg font-bold">{topCategory ? topCategory.categorie : 'Aucun'}</p>
              <p className="text-sm text-muted-foreground">{topCategory ? formatMoney(topCategory.montant) : '-'}</p>
            </div>
            <div className="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-background/50">
              <p className="text-sm text-muted-foreground">Conseil</p>
              <p className="mt-1 text-sm leading-relaxed">
                Utilise cet écran pour vérifier les achats par fournisseur, camion ou période avant de préparer les paiements et les rapports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-teal-600" />
              Journal des achats et dépenses
            </CardTitle>
            <Badge variant="secondary" className="w-fit">
              {sortedExpenses.length} ligne{sortedExpenses.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sortedExpenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">Aucun frais trouvé</p>
              <p className="mt-1 text-sm text-muted-foreground">Modifie les filtres ou ajoute une dépense depuis l’écran Dépenses.</p>
              <Button className="mt-4" onClick={() => navigate('/depenses')}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une dépense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:hover:border-teal-700"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300">
                          {expense.categorie}
                        </Badge>
                        {expense.sousCategorie && <Badge variant="outline">{expense.sousCategorie}</Badge>}
                        <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                      </div>
                      <p className="text-base font-semibold leading-snug">{expense.description || 'Dépense sans description'}</p>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <span className="flex items-center gap-2">
                          <Store className="h-4 w-4 shrink-0" />
                          {getSupplierLabel(expense.fournisseurId)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4 shrink-0" />
                          {getTruckLabel(expense.camionId)}
                        </span>
                        {expense.chauffeurId && (
                          <span className="flex items-center gap-2">
                            <PackageCheck className="h-4 w-4 shrink-0" />
                            {getDriverLabel(expense.chauffeurId)}
                          </span>
                        )}
                        {expense.quantite != null && expense.prixUnitaire != null && (
                          <span className="flex items-center gap-2">
                            <Tag className="h-4 w-4 shrink-0" />
                            {expense.quantite} x {formatMoney(expense.prixUnitaire)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-teal-50 px-4 py-3 text-right dark:bg-teal-950/30">
                      <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">Montant</p>
                      <p className={cn('text-xl font-bold tabular-nums', 'text-teal-800 dark:text-teal-200')}>{formatMoney(expense.montant)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
