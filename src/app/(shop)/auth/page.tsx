"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

type PasswordStrength = "debole" | "media" | "forte";

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return "debole";
  }

  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbol = /[^A-Za-z\d]/.test(password);

  if (hasLetters && hasNumbers && hasSymbol && password.length >= 10) {
    return "forte";
  }

  return "media";
}

function strengthClasses(strength: PasswordStrength) {
  if (strength === "forte") {
    return "bg-[#7EA890]";
  }

  if (strength === "media") {
    return "bg-[#D8AA63]";
  }

  return "bg-[#D77B7B]";
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [checkingSession, setCheckingSession] = useState(true);
  const [tab, setTab] = useState<AuthTab>("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerName, setRegisterName] = useState("");
  const [registerSurname, setRegisterSurname] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (user) {
        router.replace("/account");
        router.refresh();
        return;
      }

      setCheckingSession(false);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace("/account");
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setIsLoading(false);
      setErrorMessage("Email o password non validi.");
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptPolicy) {
      setErrorMessage("Devi accettare Privacy Policy e Termini per continuare.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage("Le password non coincidono.");
      return;
    }

    if (registerPassword.length < 8) {
      setErrorMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: registerEmail.trim(),
      password: registerPassword,
      options: {
        data: {
          first_name: registerName.trim(),
          last_name: registerSurname.trim(),
          full_name: `${registerName} ${registerSurname}`.trim(),
        },
      },
    });

    if (error) {
      setIsLoading(false);
      if (error.message.toLowerCase().includes("already registered")) {
        setErrorMessage("Questa email è già registrata. Prova ad accedere.");
      } else {
        setErrorMessage("Registrazione non completata. Riprova tra qualche istante.");
      }
      return;
    }

    if (data.session) {
      router.replace("/account");
      router.refresh();
      return;
    }

    setIsLoading(false);
    setSuccessMessage("Account creato! Controlla la tua email per confermare la registrazione.");
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });

    if (error) {
      setErrorMessage("Accesso con Google non disponibile in questo momento.");
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      setErrorMessage("Non sono riuscito a inviare l'email di reset. Controlla l'indirizzo.");
      return;
    }

    setSuccessMessage("Email inviata! Controlla la tua casella.");
    setForgotOpen(false);
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#5C5048]">
          Verifica sessione...
        </p>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(registerPassword);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center py-6">
      <p className="font-serif text-5xl text-[#1E1810]">
        Effegi<span className="italic text-[#D4918F]">Lab</span>
      </p>

      <div className="mt-5 grid w-full grid-cols-2 rounded-full border border-[#E8DED2] bg-white p-1">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={cn(
            "min-h-12 rounded-full text-sm font-medium transition",
            tab === "login" ? "bg-[#F7ECEB] text-[#1E1810]" : "text-[#6D6056]",
          )}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("register");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={cn(
            "min-h-12 rounded-full text-sm font-medium transition",
            tab === "register" ? "bg-[#F7ECEB] text-[#1E1810]" : "text-[#6D6056]",
          )}
        >
          Registrati
        </button>
      </div>

      <div className="mt-4 w-full rounded-3xl border border-black/7 bg-white p-5 shadow-sm sm:p-6">
        {tab === "login" ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                Password
              </label>
              <div className="flex h-12 items-center rounded-xl border border-[#E8DED2] pr-2 focus-within:border-[#D4918F]">
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="h-full w-full rounded-l-xl px-3 text-[16px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((value) => !value)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#6D6056]"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(loginEmail);
                setForgotOpen(true);
              }}
              className="text-sm font-medium text-[#5C5048] underline"
            >
              Password dimenticata?
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#D4918F] px-5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Accedi"}
            </button>

            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#9C9088]">
              <span className="h-px flex-1 bg-[#E8DED2]" />
              oppure
              <span className="h-px flex-1 bg-[#E8DED2]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#E8DED2] bg-white px-5 text-sm font-medium text-[#1E1810]"
            >
              Continua con Google
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="register-name" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                  Nome
                </label>
                <input
                  id="register-name"
                  type="text"
                  required
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="register-surname" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                  Cognome
                </label>
                <input
                  id="register-surname"
                  type="text"
                  required
                  value={registerSurname}
                  onChange={(event) => setRegisterSurname(event.target.value)}
                  className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="register-email" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="register-password" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                Password
              </label>
              <div className="flex h-12 items-center rounded-xl border border-[#E8DED2] pr-2 focus-within:border-[#D4918F]">
                <input
                  id="register-password"
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  className="h-full w-full rounded-l-xl px-3 text-[16px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((value) => !value)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#6D6056]"
                >
                  {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFE6DB]">
                  <div className={cn("h-full rounded-full transition-all", strengthClasses(passwordStrength), registerPassword.length < 8 ? "w-1/3" : registerPassword.length < 10 ? "w-2/3" : "w-full")} />
                </div>
                <p className="text-xs text-[#7E726A]">Forza password: {passwordStrength}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="register-confirm-password" className="text-xs uppercase tracking-[0.12em] text-[#84776D]">
                Conferma password
              </label>
              <div className="flex h-12 items-center rounded-xl border border-[#E8DED2] pr-2 focus-within:border-[#D4918F]">
                <input
                  id="register-confirm-password"
                  type={showRegisterConfirmPassword ? "text" : "password"}
                  required
                  value={registerConfirmPassword}
                  onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                  className="h-full w-full rounded-l-xl px-3 text-[16px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterConfirmPassword((value) => !value)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[#6D6056]"
                >
                  {showRegisterConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-[#5C5048]">
              <input
                type="checkbox"
                checked={acceptPolicy}
                onChange={(event) => setAcceptPolicy(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#D8CEC3] accent-[#D4918F]"
              />
              <span>Accetto Privacy Policy e Termini e Condizioni</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#D4918F] px-5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Crea Account"}
            </button>
          </form>
        )}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] px-3 py-2 text-sm text-[#A24D49]">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-[#D6E8DA] bg-[#EFF8F1] px-3 py-2 text-sm text-[#46634D]">
            {successMessage}
          </div>
        ) : null}

        <Link href="/" className="mt-5 inline-flex text-sm font-medium text-[#5C5048] underline">
          Torna al sito →
        </Link>
      </div>

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Chiudi"
            onClick={() => setForgotOpen(false)}
            className="absolute inset-0"
          />

          <div className="relative w-full rounded-t-3xl border border-black/7 bg-white p-5 sm:max-w-md sm:rounded-3xl">
            <h2 className="font-serif text-3xl text-[#1E1810]">Recupera password</h2>
            <p className="mt-1 text-sm text-[#5C5048]">Inserisci la tua email per ricevere il link di reset.</p>

            <form className="mt-4 space-y-4" onSubmit={handleResetPassword}>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
                placeholder="nome@email.it"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E8DED2] text-sm font-medium text-[#5C5048]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] text-sm font-medium text-white"
                >
                  Invia email
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
