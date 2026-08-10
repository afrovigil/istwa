import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Mail, Lock, AlertCircle, CheckCircle2, X, ArrowLeft, UserPlus, UserCheck, Phone, User } from 'lucide-react';
import { Habilitation } from '../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalNotice,
    loginWithEmail,
    registerAccount,
    registerInitialPassword,
    requestPasswordReset,
    resetPasswordWithCode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'first_time' | 'forgot' | 'reset_code'>('login');
  
  // Form fields
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [habilitation, setHabilitation] = useState<Habilitation>('opérateur');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const result = loginWithEmail(email, password);
    if (result.success) {
      setSuccessMsg('Connexion réussie !');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setEmail('');
        setPassword('');
        setSuccessMsg(null);
      }, 600);
    } else {
      setErrorMsg(result.message || 'Identifiants incorrects');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!nom.trim()) {
      setErrorMsg('Veuillez saisir votre nom complet.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Veuillez saisir votre adresse e-mail.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    const result = registerAccount({
      nom,
      mail: email,
      telephone: phone,
      pass: password,
      habilitation,
    });

    if (result.success) {
      setSuccessMsg(result.message || 'Compte créé avec succès ! En attente d\'approbation administrateur.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setNom('');
        setPhone('');
        setMode('login');
      }, 3000);
    } else {
      setErrorMsg(result.message || 'Erreur lors de la création du compte.');
    }
  };

  const handleFirstTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (password.length < 4) {
      setErrorMsg('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    const result = registerInitialPassword(email, password);
    if (result.success) {
      setSuccessMsg(result.message || 'Mot de passe configuré avec succès ! Connexion automatique...');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
        setMode('login');
      }, 800);
    } else {
      setErrorMsg(result.message || 'Adresse e-mail introuvable.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const result = requestPasswordReset(email);
    if (result.success) {
      setGeneratedCode(result.recoveryCode || '123456');
      setSuccessMsg(result.message || 'Un code de réinitialisation a été généré.');
      setMode('reset_code');
    } else {
      setErrorMsg(result.message || 'Aucun compte associé à ce courriel.');
    }
  };

  const handleResetCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (password.length < 4) {
      setErrorMsg('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    const result = resetPasswordWithCode(email, recoveryCode, password);
    if (result.success) {
      setSuccessMsg('Votre mot de passe a été réinitialisé ! Connexion en cours...');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRecoveryCode('');
        setSuccessMsg(null);
        setMode('login');
      }, 800);
    } else {
      setErrorMsg(result.message || 'Code de réinitialisation invalide.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="crystal-banner p-6 text-slate-900 relative border-b border-slate-200/80">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <img
              src="./istwa.png"
              alt="ISTWA Logo"
              className="w-11 h-11 object-contain shrink-0"
            />
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                ISTWA<span className="text-sky-600">MONITOR</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Espace d'authentification et gestion de compte ISTWA
              </p>
            </div>
          </div>

          {authModalNotice && (
            <div className="mt-3 text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white leading-relaxed font-bold shadow-sm">
              {authModalNotice}
            </div>
          )}

          {/* Tab Switcher for Login / Register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Se Connecter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('register');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'register'
                    ? 'bg-[#1E7FB8] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Créer un Compte</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Notifications / Alerts */}
          {errorMsg && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Adresse E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre.nom@istwa.org"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetFormState();
                      setMode('forgot');
                    }}
                    className="text-[11px] font-bold text-[#1E7FB8] hover:text-[#186da0]"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Se Connecter</span>
              </button>

              <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                <p className="text-[11px] text-slate-500 font-medium">
                  Nouveau sur la plateforme ou mot de passe non configuré ?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetFormState();
                      setMode('register');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold w-full transition-colors flex items-center justify-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Créer un compte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetFormState();
                      setMode('first_time');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold w-full transition-colors"
                  >
                    1ère connexion
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER ACCOUNT */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-sky-900 bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                <UserPlus className="w-4 h-4 text-[#1E7FB8] shrink-0" />
                <span>Création d'un nouveau compte utilisateur ISTWA</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Nom Complet <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Adresse E-mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jean.dupont@istwa.org"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Téléphone (Optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+242 06..."
                      className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Habilitation
                  </label>
                  <select
                    value={habilitation}
                    onChange={e => setHabilitation(e.target.value as Habilitation)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  >
                    <option value="opérateur">Opérateur</option>
                    <option value="moniteur">Moniteur</option>
                    <option value="administrateur">Administrateur</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Mot de Passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 4 caractères"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Confirmer le Mot de Passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Saisissez à nouveau votre mot de passe"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Créer Mon Compte & Se Connecter</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold w-full pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Déjà un compte ? Se connecter</span>
              </button>
            </form>
          )}

          {/* MODE 3: FIRST TIME / DECLARE INITIAL PASSWORD */}
          {mode === 'first_time' && (
            <form onSubmit={handleFirstTimeSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-sky-900 bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                <UserCheck className="w-4 h-4 text-[#1E7FB8] shrink-0" />
                <span>Déclaration initiale de mot de passe à partir de votre e-mail utilisateur</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Votre Adresse E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="E-mail enregistré par l'administrateur"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Saisissez l'adresse mail ajoutée par l'administrateur.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 4 caractères"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Confirmer le Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre mot de passe"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Définir Mon Mot de Passe & Se Connecter
              </button>

              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold w-full pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </form>
          )}

          {/* MODE 4: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                Saisissez votre adresse e-mail pour recevoir le code de récupération de votre mot de passe.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Adresse E-mail du compte
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre.nom@istwa.org"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Générer le code de récupération
              </button>

              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold w-full pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </form>
          )}

          {/* MODE 5: RESET WITH CODE */}
          {mode === 'reset_code' && (
            <form onSubmit={handleResetCodeSubmit} className="space-y-4">
              {generatedCode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-amber-900 block">Code de récupération pour {email} :</span>
                  <div className="font-mono text-sm font-black text-amber-800 tracking-wider bg-white p-2 rounded border border-amber-200 text-center">
                    {generatedCode}
                  </div>
                  <p className="text-[10px] text-amber-700">
                    Insérez ce code ci-dessous pour choisir votre nouveau mot de passe.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Code de Récupération
                </label>
                <input
                  type="text"
                  required
                  value={recoveryCode}
                  onChange={e => setRecoveryCode(e.target.value)}
                  placeholder="Ex: 123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 4 caractères"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Confirmer le Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Réinitialiser Mon Mot de Passe
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center font-medium">
          Dashboard accessible librement. Connexion requise pour les actions de modification.
        </div>
      </div>
    </div>
  );
};
