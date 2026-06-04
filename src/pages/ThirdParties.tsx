import { useMemo, useState } from 'react';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { useApp, ThirdParty, ThirdPartyType } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Building2, Users, Truck, Search, Filter, X, FileDown, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { exportToExcel, exportToPrintablePDF } from '@/lib/export-utils';
import { EMOJI } from '@/lib/emoji-palette';
import { frCollator, stableSort } from '@/lib/list-sort';
import { ListSortSelect } from '@/components/ListSortSelect';

const THIRD_SORT_OPTIONS = [
  { value: 'nom_asc', label: 'Nom A → Z' },
  { value: 'nom_desc', label: 'Nom Z → A' },
  { value: 'type_asc', label: 'Type (propriétaire → fournisseur)' },
  { value: 'type_desc', label: 'Type (fournisseur → propriétaire)' },
] as const;

const typeOrder = (t: string) => (t === 'proprietaire' ? 0 : t === 'client' ? 1 : 2);

export default function ThirdParties() {
  const { thirdParties, trucks, createThirdParty, updateThirdParty, deleteThirdParty } = useApp();
  const { canManageFleet } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdParty | null>(null);
  const { isSubmitting, withGuard } = useSubmitGuard();
  const [filterType, setFilterType] = useState<ThirdPartyType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [listSort, setListSort] = useState<string>('nom_asc');

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    type: 'proprietaire' as ThirdPartyType,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      type: 'proprietaire',
      notes: '',
    });
    setEditingThirdParty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    await withGuard(async () => {
      try {
        if (editingThirdParty) {
          await updateThirdParty(editingThirdParty.id, {
            nom: formData.nom,
            telephone: formData.telephone || undefined,
            email: formData.email || undefined,
            adresse: formData.adresse || undefined,
            type: formData.type,
            notes: formData.notes || undefined,
          });
          toast.success('Tier modifié avec succès');
        } else {
          await createThirdParty({
            nom: formData.nom,
            telephone: formData.telephone || undefined,
            email: formData.email || undefined,
            adresse: formData.adresse || undefined,
            type: formData.type,
            notes: formData.notes || undefined,
          });
          toast.success('Tier ajouté avec succès');
        }
        setIsDialogOpen(false);
        resetForm();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      }
    });
  };

  const handleEdit = (thirdParty: ThirdParty) => {
    setEditingThirdParty(thirdParty);
    setFormData({
      nom: thirdParty.nom,
      telephone: thirdParty.telephone || '',
      email: thirdParty.email || '',
      adresse: thirdParty.adresse || '',
      type: thirdParty.type,
      notes: thirdParty.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const thirdParty = thirdParties.find(tp => tp.id === id);
    if (!thirdParty) return;

    if (thirdParty.type === 'proprietaire') {
      const trucksUsingOwner = trucks.filter(t => t.proprietaireId === id);
      if (trucksUsingOwner.length > 0) {
        toast.error(`Impossible de supprimer ce propriétaire : ${trucksUsingOwner.length} camion(s) lui sont associés`);
        return;
      }
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${thirdParty.nom} ?`)) {
      try {
        await deleteThirdParty(id);
        toast.success('Tier supprimé');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      }
    }
  };

  const filteredThirdParties = thirdParties.filter(tp => {
    if (filterType !== 'all' && tp.type !== filterType) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tp.nom.toLowerCase().includes(search) ||
        (tp.telephone && tp.telephone.includes(search)) ||
        (tp.email && tp.email.toLowerCase().includes(search)) ||
        (tp.adresse && tp.adresse.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const sortedThirdParties = useMemo(() => {
    const list = [...filteredThirdParties];
    switch (listSort) {
      case 'nom_desc':
        return stableSort(list, (a, b) => frCollator.compare(b.nom, a.nom));
      case 'type_asc':
        return stableSort(list, (a, b) => typeOrder(a.type) - typeOrder(b.type) || frCollator.compare(a.nom, b.nom));
      case 'type_desc':
        return stableSort(list, (a, b) => typeOrder(b.type) - typeOrder(a.type) || frCollator.compare(a.nom, b.nom));
      case 'nom_asc':
      default:
        return stableSort(list, (a, b) => frCollator.compare(a.nom, b.nom));
    }
  }, [filteredThirdParties, listSort]);

  const getTypeIcon = (type: ThirdPartyType) => {
    switch (type) {
      case 'proprietaire':
        return <Truck className="h-4 w-4" />;
      case 'client':
        return <Users className="h-4 w-4" />;
      case 'fournisseur':
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: ThirdPartyType) => {
    switch (type) {
      case 'proprietaire':
        return 'Propriétaire';
      case 'client':
        return 'Client';
      case 'fournisseur':
        return 'Fournisseur';
    }
  };

  const getTypeColor = (type: ThirdPartyType) => {
    switch (type) {
      case 'proprietaire':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'client':
        return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400';
      case 'fournisseur':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
    }
  };

  const proprietairesCount = thirdParties.filter(tp => tp.type === 'proprietaire').length;
  const clientsCount = thirdParties.filter(tp => tp.type === 'client').length;
  const fournisseursCount = thirdParties.filter(tp => tp.type === 'fournisseur').length;

  // Fonction pour générer la description des filtres
  const getFiltersDescription = () => {
    const filters: string[] = [];
    if (searchTerm) filters.push(`Recherche: "${searchTerm}"`);
    if (filterType !== 'all') filters.push(`Type: ${getTypeLabel(filterType)}`);
    const sortLabel = THIRD_SORT_OPTIONS.find((o) => o.value === listSort)?.label;
    if (sortLabel) filters.push(`Tri: ${sortLabel}`);
    return filters.length > 0 ? `Filtres appliqués: ${filters.join(', ')}` : sortLabel ? `Tri: ${sortLabel}` : undefined;
  };

  // Fonctions d'export
  const handleExportExcel = () => {
    exportToExcel({
      title: 'Liste des Tiers',
      fileName: `tiers_${new Date().toISOString().split('T')[0]}.xlsx`,
      filtersDescription: getFiltersDescription(),
      columns: [
        { header: 'Nom', value: (tp) => tp.nom },
        { header: 'Type', value: (tp) => getTypeLabel(tp.type) },
        { header: 'Téléphone', value: (tp) => tp.telephone || '-' },
        { header: 'Email', value: (tp) => tp.email || '-' },
        { header: 'Adresse', value: (tp) => tp.adresse || '-' },
        { header: 'Notes', value: (tp) => tp.notes || '-' },
      ],
      rows: sortedThirdParties,
    });
    toast.success('Export Excel généré avec succès');
  };

  const handleExportPDF = () => {
    // Calculer les totaux par type
    const totalProprietaires = filteredThirdParties.filter(tp => tp.type === 'proprietaire').length;
    const totalClients = filteredThirdParties.filter(tp => tp.type === 'client').length;
    const totalFournisseurs = filteredThirdParties.filter(tp => tp.type === 'fournisseur').length;

    exportToPrintablePDF({
      title: 'Liste des Tiers',
      fileName: `tiers_${new Date().toISOString().split('T')[0]}.pdf`,
      filtersDescription: getFiltersDescription(),
      // Couleurs thématiques pour les tiers (indigo/violet)
      headerColor: '#4f46e5',
      headerTextColor: '#ffffff',
      evenRowColor: '#eef2ff',
      oddRowColor: '#ffffff',
      accentColor: '#4f46e5',
      totals: [
        { label: 'Total Tiers', value: filteredThirdParties.length, style: 'neutral', icon: EMOJI.liste },
        { label: 'Propriétaires', value: totalProprietaires, style: 'neutral', icon: '🏢' },
        { label: 'Clients', value: totalClients, style: 'positive', icon: '👥' },
        { label: 'Fournisseurs', value: totalFournisseurs, style: 'neutral', icon: '🏭' },
      ],
      columns: [
        { header: 'Nom', value: (tp) => tp.nom },
        { header: 'Type', value: (tp) => {
          const icons: Record<string, string> = {
            'proprietaire': '🏢',
            'client': '👥',
            'fournisseur': '🏭',
          };
          return `${icons[tp.type] || '📋'} ${getTypeLabel(tp.type)}`;
        }},
        { header: 'Téléphone', value: (tp) => tp.telephone ? `${EMOJI.telephone} ${tp.telephone}` : '-' },
        { header: 'Email', value: (tp) => tp.email ? `${EMOJI.email} ${tp.email}` : '-' },
        { header: 'Adresse', value: (tp) => tp.adresse ? `${EMOJI.adresse} ${tp.adresse}` : '-' },
      ],
      rows: sortedThirdParties,
    });
  };

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        title="Gestion des Tiers"
        description="Gérez les propriétaires de camions, clients et fournisseurs"
        icon={Building2}
        gradient="from-indigo-500/20 via-purple-500/10 to-transparent"
        stats={[
          {
            label: 'Propriétaires',
            value: proprietairesCount,
            icon: <Truck className="h-4 w-4" />,
            color: 'text-blue-600 dark:text-blue-400'
          },
          {
            label: 'Clients',
            value: clientsCount,
            icon: <Users className="h-4 w-4" />,
            color: 'text-green-600 dark:text-green-400'
          },
          {
            label: 'Fournisseurs',
            value: fournisseursCount,
            icon: <Building2 className="h-4 w-4" />,
            color: 'text-orange-600 dark:text-orange-400'
          },
          {
            label: 'Total',
            value: thirdParties.length,
            icon: <Building2 className="h-4 w-4" />,
            color: 'text-purple-600 dark:text-purple-400'
          }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} className="shadow-md hover:shadow-lg transition-all duration-300">
              <FileDown className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="shadow-md hover:shadow-lg transition-all duration-300">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              {canManageFleet && (
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un tier
                </Button>
              </DialogTrigger>
              )}
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingThirdParty ? 'Modifier le tier' : 'Ajouter un tier'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as ThirdPartyType })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprietaire">Propriétaire de camion</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="fournisseur">Fournisseur d'articles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nom">Nom / Raison sociale *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom complet ou raison sociale"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="+237 6 12 34 56 78"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="exemple@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : (editingThirdParty ? 'Modifier' : 'Ajouter')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-br from-background to-muted/20 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres de recherche
            </CardTitle>
            {(searchTerm || filterType !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setListSort('nom_asc');
                }}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recherche générale */}
            <div>
              <Label htmlFor="search-third-parties" className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Recherche générale
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-third-parties"
                  placeholder="Rechercher par nom, téléphone, email ou adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtres actifs */}
            {filterType !== 'all' && (
              <div className="flex flex-wrap gap-2 pb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
                  {getTypeLabel(filterType)}
                  <button
                    onClick={() => setFilterType('all')}
                    className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                    aria-label="Retirer le filtre type"
                    title="Retirer le filtre type"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            {/* Sélecteurs de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ListSortSelect
                id="sort-third-parties"
                value={listSort}
                onChange={setListSort}
                options={[...THIRD_SORT_OPTIONS]}
              />
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2">Type</Label>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as ThirdPartyType | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="proprietaire">Propriétaires</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="fournisseur">Fournisseurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedThirdParties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'Aucun tier ne correspond à votre recherche' 
                : 'Aucun tier enregistré'}
            </p>
          </div>
        ) : (
          sortedThirdParties.map((thirdParty) => {
            const trucksCount = trucks.filter(t => t.proprietaireId === thirdParty.id).length;
            
            return (
              <Card key={thirdParty.id} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 group">
                <CardHeader className="bg-gradient-to-br from-background to-muted/20 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{thirdParty.nom}</CardTitle>
                      </div>
                      <Badge className={getTypeColor(thirdParty.type)}>
                        <span className="mr-1">{getTypeIcon(thirdParty.type)}</span>
                        {getTypeLabel(thirdParty.type)}
                      </Badge>
                      {thirdParty.type === 'proprietaire' && trucksCount > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {trucksCount} camion{trucksCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {canManageFleet && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(thirdParty)}
                        className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(thirdParty.id)}
                        className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {thirdParty.telephone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{EMOJI.telephone}</span>
                        <span>{thirdParty.telephone}</span>
                      </div>
                    )}
                    {thirdParty.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{EMOJI.email}</span>
                        <span className="truncate">{thirdParty.email}</span>
                      </div>
                    )}
                    {thirdParty.adresse && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground">📍</span>
                        <span className="flex-1">{thirdParty.adresse}</span>
                      </div>
                    )}
                    {thirdParty.notes && (
                      <div className="pt-2 border-t border-dashed">
                        <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{thirdParty.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


