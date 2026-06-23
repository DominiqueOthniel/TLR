import { useState, useEffect } from 'react';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { COMPANY_BRAND_NAME } from '@/lib/invoice-branding';
import { useAuth, LOGIN_USER_OPTIONS } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<string>('pdg');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isSubmitting: loading, withGuard } = useSubmitGuard();
  const { user, users, usersLoading, usersError, login: doLogin, refreshUsers } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!users.length) return;
    if (!users.some((u) => u.login === selectedUser)) {
      setSelectedUser(users[0].login);
    }
  }, [selectedUser, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) {
      toast.error('Veuillez sélectionner un utilisateur et entrer le mot de passe');
      return;
    }
    await withGuard(async () => {
      try {
        const ok = await doLogin(selectedUser, password);
        if (ok) {
          toast.success('Connexion réussie');
          navigate('/', { replace: true });
        } else {
          toast.error('Identifiants incorrects');
        }
      } catch {
        toast.error('Erreur de connexion');
      }
    });
  };

  const selectedSummary = users.find(o => o.login === selectedUser);
  const selectedOption = selectedSummary
    ? LOGIN_USER_OPTIONS.find(o => o.login === selectedSummary.role)
    : LOGIN_USER_OPTIONS.find(o => o.login === selectedUser);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a1330]">

      {/* Fond animé — orbes aux couleurs du logo (marine + bordeaux) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-40 w-[620px] h-[620px] rounded-full bg-[#1e3a8a]/30 blur-[130px] animate-float" />
        <div className="absolute -bottom-48 -right-40 w-[560px] h-[560px] rounded-full bg-[#7a1f2b]/35 blur-[120px] login-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-[#2447a3]/15 blur-[90px]" />
        {/* Grille subtile */}
        <div className="absolute inset-0 text-white opacity-[0.035] bg-dot-pattern" />
        {/* Filet doré séparateur haut */}
      </div>

      {/* Carte de connexion */}
      <div className="relative w-full max-w-md mx-4 animate-fade-in-scale">

        {/* Halo derrière la carte (marine → bordeaux) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/40 via-transparent to-[#7a1f2b]/40 rounded-[2rem] blur-2xl scale-105 opacity-80" />

        <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/12 rounded-[2rem] p-8 shadow-2xl shadow-black/40">

          {/* Liseré supérieur dégradé marque */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-2/3 rounded-full bg-gradient-to-r from-[#1e3a8a] via-amber-300 to-[#7a1f2b]" />

          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            {/* Logo marque */}
            <div className="relative mb-5 flex justify-center items-center">
              <div
                className="absolute w-[18rem] h-32 sm:w-[21rem] sm:h-40 rounded-[2rem] bg-gradient-to-br from-[#1e3a8a]/50 to-[#7a1f2b]/45 blur-2xl scale-[1.08] animate-pulse-glow"
                aria-hidden
              />
              <AppLogo variant="login" className="relative z-[1]" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-1.5">
              <span className="bg-gradient-to-r from-blue-300 via-white to-rose-300 bg-clip-text text-transparent">
                Transport et logistique
              </span>
            </h1>
            <p className="text-white/45 text-sm">Plateforme de gestion de flotte, Cameroun</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {usersError && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100/90 leading-relaxed">
                {usersError}
                <button
                  type="button"
                  onClick={() => void refreshUsers()}
                  className="mt-2 block text-amber-200 underline underline-offset-2 hover:text-white"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Sélecteur utilisateur */}
            <div className="space-y-2">
              <Label className="text-white/65 text-xs font-semibold uppercase tracking-wider">Utilisateur</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser} disabled={loading || usersLoading}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-12 rounded-xl hover:bg-white/[0.07] focus:ring-blue-400/40 focus:border-blue-400/50 transition-all">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <User className="h-4 w-4 text-blue-300/70 shrink-0" />
                    {usersLoading ? (
                      <span className="text-white/50">Chargement des comptes…</span>
                    ) : (
                      <SelectValue placeholder="Choisir un utilisateur" />
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-[#101a3a] border-white/10">
                  {users.map((opt) => {
                    const roleOption = LOGIN_USER_OPTIONS.find(o => o.login === opt.role);
                    return (
                    <SelectItem
                      key={opt.login}
                      value={opt.login}
                      textValue={opt.login}
                      className="text-white/80 focus:bg-blue-500/20 focus:text-white"
                    >
                      {opt.login} <span className="text-white/45">({roleOption?.label ?? opt.role})</span>
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Rôle sélectionné : rappel des responsabilités */}
            {selectedOption && (
              <div className="rounded-xl border border-blue-400/20 bg-blue-500/[0.08] px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-300 flex-shrink-0" />
                  <span className="text-blue-100 text-sm font-semibold">{selectedOption.label}</span>
                </div>
                <p className="text-blue-100/70 text-xs leading-relaxed pl-6 border-l-2 border-[#7a1f2b]/50 ml-1">
                  {selectedOption.description}
                </p>
              </div>
            )}

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label className="text-white/65 text-xs font-semibold uppercase tracking-wider">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/60" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 h-12 pl-10 pr-10 rounded-xl focus:border-blue-400/60 focus:ring-blue-400/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Bouton connexion (marine → bordeaux) */}
            <Button
              type="submit"
              disabled={loading}
              className="group w-full h-12 bg-gradient-to-r from-[#1e3a8a] via-[#3b2a78] to-[#7a1f2b] hover:from-[#234aa8] hover:via-[#4a3290] hover:to-[#94283a] text-white font-semibold rounded-xl shadow-lg shadow-[#1e3a8a]/30 hover:shadow-[#7a1f2b]/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Se connecter
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-center gap-2 text-white/30 text-xs">
            <Lock className="h-3 w-3" />
            <span>Connexion sécurisée, {COMPANY_BRAND_NAME} © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
