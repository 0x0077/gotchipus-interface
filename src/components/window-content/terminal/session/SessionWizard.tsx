"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCreateSessionKey, type CreationStep } from "@/hooks/useCreateSessionKey";

// ── Types ─────────────────────────────────────────────────

export interface SessionWizardData {
  active: boolean;
  expiresAt: number;
  maxPerTx: number;
  maxPerSession: number;
  dailyLimit: number;
  singleTxLimit: number;
  enabledOptions: {
    blockInfiniteApproval: boolean;
    dailyTransferLimit: boolean;
    singleTxLimit: boolean;
    restrictTarget: boolean;
  };
  whitelistMode: boolean;
  whitelist: string[];
  blacklist: string[];
  risk_preference?: string;
  slippage?: number;
  tone?: string;
  verbosity?: string;
  // Usage stats (from DB, read-only)
  usedValue?: number;
  usedToday?: number;
}

interface SessionWizardProps {
  onComplete: (data: SessionWizardData) => void;
  onClose: () => void;
  tokenId?: string;
  existingSession?: Partial<SessionWizardData> | null;
}

// ── Win98 shared class strings ────────────────────────────

const CLS = {
  raised: "win98-bezel shadow-win98-outer",
  raisedActive: "active:shadow-win98-inner",
  sunken: "win98-bezel-inset shadow-win98-inner",
  input: "win98-bezel-inset shadow-win98-inner bg-white px-1.5 py-0.5 text-sm focus:outline-none",
};

// ── Local Primitives ──────────────────────────────────────

function Btn({
  children,
  onClick,
  primary = false,
  small = false,
  variant,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  small?: boolean;
  /** "default" | "sign" */
  variant?: "sign";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1 cursor-pointer font-[inherit] text-sm " +
    CLS.raised + " " + CLS.raisedActive;

  if (variant === "sign") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} px-6 py-1.5 bg-[#000080] text-white font-bold ${primary ? "outline outline-1 outline-black outline-offset-[-3px]" : ""} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} bg-win98-face text-[#000000] ${small ? "px-2 py-0.5" : "px-4 py-1"} ${primary ? "outline outline-1 outline-black outline-offset-[-3px]" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function GroupBox({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`win98-group-box bg-win98-face ${className}`}>
      {label && <div className="win98-group-title text-sm">{label}</div>}
      {children}
    </div>
  );
}

function Sunken({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${CLS.sunken} bg-white p-1.5 ${className}`}>
      {children}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
      <path d="M15.8334 10.8333H10.8334V15.8333H9.16675V10.8333H4.16675V9.16663H9.16675V4.16663H10.8334V9.16663H15.8334V10.8333Z" fill="currentColor" />
    </svg>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0 w-[22px] h-[22px] bg-[#000080] text-white text-sm font-bold font-mono">
      {n}
    </span>
  );
}

// ── Step status helpers for creation progress ─

const STEP_ORDER: CreationStep[] = ['signing', 'contract', 'confirming', 'api'];

function getStepStatus(current: CreationStep, target: CreationStep): 'done' | 'active' | 'pending' {
  const ci = STEP_ORDER.indexOf(current);
  const ti = STEP_ORDER.indexOf(target);
  if (ci > ti) return 'done';
  if (ci === ti) return 'active';
  return 'pending';
}

function StepStatus({ label, status }: { label: string; status: 'done' | 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === 'done' && <span className="text-[#008000] font-bold">✓</span>}
      {status === 'active' && <span className="inline-block w-3 h-3 border-2 border-[#000080] border-t-transparent rounded-full animate-spin" />}
      {status === 'pending' && <span className="text-[#808080]">○</span>}
      <span className={status === 'active' ? 'font-bold text-[#000080]' : status === 'done' ? 'text-[#008000]' : 'text-[#808080]'}>
        {label}
      </span>
    </div>
  );
}

// ── Toggle row (checkbox + label, highlighted when active) ─

function ToggleRow({
  checked,
  onToggle,
  children,
  className = "",
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer border border-[#808080] select-none ${checked ? "bg-[#000080] text-white" : "bg-white text-[#000000]"} ${className}`}
    >
      <input type="checkbox" checked={checked} readOnly onClick={e => e.stopPropagation()} />
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

export function SessionWizard({ onComplete, onClose, tokenId, existingSession }: SessionWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Step 1
  const [expiration, setExpiration] = useState("7");
  const [maxPerTx, setMaxPerTx] = useState(existingSession?.maxPerTx?.toString() || "100");
  const [maxPerSession, setMaxPerSession] = useState(existingSession?.maxPerSession?.toString() || "1000");

  // Step 2 – enabled options
  const [blockInfiniteApproval, setBlockInfiniteApproval] = useState(existingSession?.enabledOptions?.blockInfiniteApproval ?? true);
  const [dailyTransferLimitEnabled, setDailyTransferLimitEnabled] = useState(existingSession?.enabledOptions?.dailyTransferLimit ?? false);
  const [singleTxLimitEnabled, setSingleTxLimitEnabled] = useState(existingSession?.enabledOptions?.singleTxLimit ?? false);
  const [restrictTarget, setRestrictTarget] = useState(existingSession?.enabledOptions?.restrictTarget ?? false);

  const [dailyLimit, setDailyLimit] = useState(existingSession?.dailyLimit?.toString() || "0");
  const [singleTxLimit, setSingleTxLimit] = useState(existingSession?.singleTxLimit?.toString() || "0");

  // Step 2 – whitelist / blacklist contracts
  const [whitelistMode, setWhitelistMode] = useState(existingSession?.whitelistMode ?? true);
  const [whitelistContracts, setWhitelistContracts] = useState<Array<{ name: string; address: string }>>([]);
  const [blacklistContracts, setBlacklistContracts] = useState<Array<{ name: string; address: string }>>([]);
  const [whitelistErrors, setWhitelistErrors] = useState<Record<number, string>>({});
  const [blacklistErrors, setBlacklistErrors] = useState<Record<number, string>>({});

  // buildOptions: local pure computation matching the contract's bitmask logic
  // enum SecurityOption { BlockInfiniteApproval=0, DailyTransferLimit=1, SingleTxLimit=2, RestrictTarget=3 }
  const enabledOptionsBits = (() => {
    let options = BigInt(0);
    if (blockInfiniteApproval)     options |= BigInt(1) << BigInt(0);
    if (dailyTransferLimitEnabled) options |= BigInt(1) << BigInt(1);
    if (singleTxLimitEnabled)      options |= BigInt(1) << BigInt(2);
    if (restrictTarget)            options |= BigInt(1) << BigInt(3);
    return options;
  })();

  // Step 3
  const [tone, setTone] = useState(existingSession?.tone || "Friendly");
  const [verbosity, setVerbosity] = useState(existingSession?.verbosity || "Normal");
  const [riskPref, setRiskPref] = useState(existingSession?.risk_preference || "Balanced");
  const [slippage, setSlippage] = useState(existingSession?.slippage?.toString() || "0.5");

  // ── Validation ──
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  // ── Whitelist CRUD ──
  const addWhitelistContract = () => setWhitelistContracts(prev => [...prev, { name: "", address: "" }]);
  const updateWhitelistContract = (index: number, field: "name" | "address", value: string) => {
    setWhitelistContracts(prev => {
      const updated = prev.map((c, i) => (i === index ? { ...c, [field]: value } : c));
      if (field === "address") {
        setWhitelistErrors(errs => {
          const next = { ...errs };
          if (value && !isValidAddress(value)) next[index] = t('sessionWizard.invalidAddress');
          else delete next[index];
          return next;
        });
        if (value && isValidAddress(value) && !updated[index].name)
          updated[index] = { ...updated[index], name: t('sessionWizard.contractDefault', { n: index + 1 }) };
      }
      return updated;
    });
  };
  const removeWhitelistContract = (index: number) => {
    setWhitelistContracts(prev => prev.filter((_, i) => i !== index));
    setWhitelistErrors(errs => { const next = { ...errs }; delete next[index]; return next; });
  };

  // ── Blacklist CRUD ──
  const addBlacklistContract = () => setBlacklistContracts(prev => [...prev, { name: "", address: "" }]);
  const updateBlacklistContract = (index: number, field: "name" | "address", value: string) => {
    setBlacklistContracts(prev => {
      const updated = prev.map((c, i) => (i === index ? { ...c, [field]: value } : c));
      if (field === "address") {
        setBlacklistErrors(errs => {
          const next = { ...errs };
          if (value && !isValidAddress(value)) next[index] = t('sessionWizard.invalidAddress');
          else delete next[index];
          return next;
        });
        if (value && isValidAddress(value) && !updated[index].name)
          updated[index] = { ...updated[index], name: t('sessionWizard.contractDefault', { n: index + 1 }) };
      }
      return updated;
    });
  };
  const removeBlacklistContract = (index: number) => {
    setBlacklistContracts(prev => prev.filter((_, i) => i !== index));
    setBlacklistErrors(errs => { const next = { ...errs }; delete next[index]; return next; });
  };

  // ── Compiled output ──
  const compiledWhitelist = whitelistContracts.filter(c => c.address && isValidAddress(c.address)).map(c => c.address);
  const compiledBlacklist = blacklistContracts.filter(c => c.address && isValidAddress(c.address)).map(c => c.address);

  const progress = (step / TOTAL_STEPS) * 100;

  // ── Real signing via useCreateSessionKey ──
  const { createSessionKey, isCreating, creationStep, error: signError, isReady, existingSession: activeSession, checkExistingSession, txHash } =
    useCreateSessionKey({
      onSuccess: () => {
        onComplete({
          active: true,
          expiresAt: Date.now() + parseInt(expiration) * 86400000,
          maxPerTx: parseInt(maxPerTx),
          maxPerSession: parseInt(maxPerSession),
          dailyLimit: dailyTransferLimitEnabled ? parseInt(dailyLimit) : 0,
          singleTxLimit: singleTxLimitEnabled ? parseInt(singleTxLimit) : 0,
          enabledOptions: {
            blockInfiniteApproval,
            dailyTransferLimit: dailyTransferLimitEnabled,
            singleTxLimit: singleTxLimitEnabled,
            restrictTarget,
          },
          whitelistMode,
          whitelist: compiledWhitelist,
          blacklist: compiledBlacklist,
          risk_preference: riskPref,
          slippage: parseFloat(slippage),
          tone,
          verbosity,
        });
      },
    });

  useEffect(() => {
    if (isReady) checkExistingSession(tokenId);
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async () => {
    if (!tokenId || isCreating) return;

    await createSessionKey({
      selectedNFTId: tokenId,
      sessionKeySettings: {
        expirationDays: parseInt(expiration),
        maxPerTx: parseInt(maxPerTx),
        maxPerSession: parseInt(maxPerSession),
        dailyLimit: dailyTransferLimitEnabled ? parseInt(dailyLimit) : 0,
        singleTxLimit: singleTxLimitEnabled ? parseInt(singleTxLimit) : 0,
      },
      securitySettings: {
        enabledOptionsBits,
        whitelistMode,
        whitelist: compiledWhitelist,
        blacklist: compiledBlacklist,
      },
      behaviorSettings: {
        risk_preference: riskPref,
        slippage: parseFloat(slippage),
        tone,
        verbosity,
      },
    });
  };

  // ── Toggle button (risk / personality / verbosity) ──
  const ToggleBtn = ({ value, active, onClick, children }: { value: string; active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-0.5 text-xs capitalize ${CLS.raised} ${CLS.raisedActive} ${active ? "bg-[#000080] text-white" : "bg-win98-face text-[#000000]"}`}
      key={value}
    >
      {children}
    </button>
  );

  return (
    <div className={`flex flex-col bg-win98-face ${CLS.raised} w-[720px] max-h-[90vh] text-sm font-[inherit]`}>

      {/* ── Title Bar ── */}
      <div className="flex items-center gap-1 px-1 py-0.5 bg-gradient-to-r from-[#000080] to-[#1084d0] select-none">
        <span className="text-xs">[KEY]</span>
        <span className="flex-1 text-white text-sm font-bold">
          {t('sessionWizard.title')}{tokenId ? ` — Gotchipus #${tokenId}` : ""}
        </span>
        <button
          type="button"
          onClick={onClose}
          className={`w-4 h-[14px] flex items-center justify-center text-xs font-bold font-mono cursor-pointer bg-win98-face ${CLS.raised} ${CLS.raisedActive}`}
        >×</button>
      </div>

      {/* ── Body ── */}
      <div className="flex gap-3 p-3 overflow-auto flex-1">

        {/* Left: Steps */}
        <div className="flex-1 flex flex-col min-w-0">
          <GroupBox label={t('sessionWizard.title')} className="mb-2 flex-1">
            <p className="text-xs text-[#808080] mb-2">{t('sessionWizard.configureDescription')}</p>

            {/* Progress bar */}
            <div className={`${CLS.sunken} h-4 bg-white p-0.5 mb-3`}>
              <div className="h-full bg-[#000080] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* ══ STEP 1 ══ */}
            {step === 1 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <StepBadge n={1} />
                  <div>
                    <p className="font-bold text-sm">{t('sessionWizard.setTxLimits')}</p>
                    <p className="text-xs text-[#808080]">{t('sessionWizard.configureSpendingLimits')}</p>
                  </div>
                </div>

                <GroupBox label={t('sessionWizard.expiration')}>
                  <p className="text-xs text-[#808080] mb-1.5">{t('sessionWizard.sessionExpireAfter')}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={expiration}
                      onChange={e => setExpiration(e.target.value)}
                      className={`${CLS.input} w-[120px] cursor-pointer`}
                    >
                      <option value="1">{t('sessionWizard.duration.1d')}</option>
                      <option value="3">{t('sessionWizard.duration.3d')}</option>
                      <option value="7">{t('sessionWizard.duration.7d')}</option>
                      <option value="14">{t('sessionWizard.duration.14d')}</option>
                      <option value="30">{t('sessionWizard.duration.30d')}</option>
                    </select>
                    <span>{t('sessionWizard.beforeRenewal')}</span>
                  </div>
                </GroupBox>

                <GroupBox label={t('sessionWizard.spendingLimits')}>
                  <div className="mb-2.5">
                    <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.maxPerTxLabel')}</p>
                    <div className="flex items-center gap-2">
                      <input value={maxPerTx} onChange={e => setMaxPerTx(e.target.value)} className={`${CLS.input} w-[100px] font-mono`} />
                      <span className="font-bold text-[#000080]">{t('sessionWizard.prosPerTx')}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.maxPerSessionLabel')}</p>
                    <div className="flex items-center gap-2">
                      <input value={maxPerSession} onChange={e => setMaxPerSession(e.target.value)} className={`${CLS.input} w-[100px] font-mono`} />
                      <span className="font-bold text-[#000080]">{t('sessionWizard.prosTotalCapacity')}</span>
                    </div>
                  </div>
                </GroupBox>

                <div className="px-2.5 py-1.5 bg-[#ffffee] border border-[#e0e0c0] text-xs">
                  {t('sessionWizard.limitsInfo')}
                </div>
              </div>
            )}

            {/* ══ STEP 2 ══ */}
            {step === 2 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <StepBadge n={2} />
                  <div>
                    <p className="font-bold text-sm">{t('sessionWizard.configurePermissions')}</p>
                    <p className="text-xs text-[#808080]">{t('sessionWizard.configurePermissionsDesc')}</p>
                  </div>
                </div>

                {/* Security Options (enabledOptions) */}
                <GroupBox label={t('sessionWizard.securityOptions')}>
                  <p className="text-xs text-[#808080] mb-1.5">{t('sessionWizard.enableSecurityRestrictions')}</p>

                  <ToggleRow checked={blockInfiniteApproval} onToggle={() => setBlockInfiniteApproval(v => !v)} className="mb-0.5">
                    <div>
                      <p className="font-bold text-sm">{t('sessionWizard.blockInfiniteApproval')}</p>
                      <p className="text-xs opacity-80">{t('sessionWizard.blockInfiniteApprovalDesc')}</p>
                    </div>
                  </ToggleRow>

                  <ToggleRow checked={dailyTransferLimitEnabled} onToggle={() => setDailyTransferLimitEnabled(v => !v)} className="mb-0.5">
                    <div>
                      <p className="font-bold text-sm">{t('sessionWizard.dailyTransferLimit')}</p>
                      <p className="text-xs opacity-80">{t('sessionWizard.dailyTransferLimitDesc')}</p>
                    </div>
                  </ToggleRow>
                  {dailyTransferLimitEnabled && (
                    <div className="ml-6 mb-1.5">
                      <div className="flex items-center gap-2">
                        <input value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} className={`${CLS.input} w-[100px] font-mono`} />
                        <span className="font-bold text-[#000080]">{t('sessionWizard.prosPerDay')}</span>
                      </div>
                    </div>
                  )}

                  <ToggleRow checked={singleTxLimitEnabled} onToggle={() => setSingleTxLimitEnabled(v => !v)} className="mb-0.5">
                    <div>
                      <p className="font-bold text-sm">{t('sessionWizard.singleTxLimit')}</p>
                      <p className="text-xs opacity-80">{t('sessionWizard.singleTxLimitDesc')}</p>
                    </div>
                  </ToggleRow>
                  {singleTxLimitEnabled && (
                    <div className="ml-6 mb-1.5">
                      <div className="flex items-center gap-2">
                        <input value={singleTxLimit} onChange={e => setSingleTxLimit(e.target.value)} className={`${CLS.input} w-[100px] font-mono`} />
                        <span className="font-bold text-[#000080]">{t('sessionWizard.prosPerTxShort')}</span>
                      </div>
                    </div>
                  )}

                  <ToggleRow checked={restrictTarget} onToggle={() => setRestrictTarget(v => !v)}>
                    <div>
                      <p className="font-bold text-sm">{t('sessionWizard.restrictContracts')}</p>
                      <p className="text-xs opacity-80">{t('sessionWizard.restrictContractsDesc')}</p>
                    </div>
                  </ToggleRow>
                </GroupBox>

                {/* Whitelist / Blacklist (only shown when restrictTarget is enabled) */}
                {restrictTarget && (
                  <>
                    {/* Mode selector */}
                    <GroupBox label={t('sessionWizard.accessControl')}>
                      <p className="text-xs text-[#808080] mb-1.5">{t('sessionWizard.chooseAccessMode')}</p>
                      <div className="flex gap-0.5 mb-1">
                        <ToggleBtn value="whitelist" active={whitelistMode} onClick={() => setWhitelistMode(true)}>
                          {t('sessionWizard.whitelist')}
                        </ToggleBtn>
                        <ToggleBtn value="blacklist" active={!whitelistMode} onClick={() => setWhitelistMode(false)}>
                          {t('sessionWizard.blacklist')}
                        </ToggleBtn>
                      </div>
                      <p className="text-xs text-[#808080]">
                        {whitelistMode
                          ? t('sessionWizard.whitelistModeHint')
                          : t('sessionWizard.blacklistModeHint')}
                      </p>
                    </GroupBox>

                    {/* Whitelist Contracts (shown in whitelist mode) */}
                    {whitelistMode && (
                      <GroupBox label={t('sessionWizard.whitelistContracts')}>
                        <p className="text-xs text-[#808080] mb-1.5">{t('sessionWizard.whitelistContractsDesc')}</p>

                        {whitelistContracts.map((c, i) => (
                          <div key={i} className={`${CLS.sunken} bg-[#f8f8f8] p-1.5 mb-1`}>
                            <div className="flex gap-1.5">
                              <div className="w-[30%]">
                                <p className="text-sm text-[#808080] mb-0.5">{t('sessionWizard.nameLabel')}</p>
                                <input
                                  value={c.name}
                                  onChange={e => updateWhitelistContract(i, "name", e.target.value)}
                                  placeholder={t('sessionWizard.contractDefault', { n: i + 1 })}
                                  className={`${CLS.input} w-full`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#808080] mb-0.5">{t('sessionWizard.addressLabel')}</p>
                                <input
                                  value={c.address}
                                  onChange={e => updateWhitelistContract(i, "address", e.target.value)}
                                  placeholder="0x..."
                                  className={`${CLS.input} w-full font-mono ${whitelistErrors[i] ? "border-red-600" : ""}`}
                                />
                                {whitelistErrors[i] && <p className="text-sm text-red-600 mt-0.5">{whitelistErrors[i]}</p>}
                              </div>
                              <div className="flex items-end pb-0.5 shrink-0">
                                <Btn small onClick={() => removeWhitelistContract(i)}>✕</Btn>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Btn small onClick={addWhitelistContract} className="mt-1">
                          <PlusIcon /> {t('sessionWizard.addWhitelistContract')}
                        </Btn>
                      </GroupBox>
                    )}

                    {/* Blacklist Contracts (shown in blacklist mode) */}
                    {!whitelistMode && (
                      <GroupBox label={t('sessionWizard.blacklistContracts')}>
                        <p className="text-xs text-[#808080] mb-1.5">{t('sessionWizard.blacklistContractsDesc')}</p>

                        {blacklistContracts.map((c, i) => (
                          <div key={i} className={`${CLS.sunken} bg-[#f8f8f8] p-1.5 mb-1`}>
                            <div className="flex gap-1.5">
                              <div className="w-[30%]">
                                <p className="text-sm text-[#808080] mb-0.5">{t('sessionWizard.nameLabel')}</p>
                                <input
                                  value={c.name}
                                  onChange={e => updateBlacklistContract(i, "name", e.target.value)}
                                  placeholder={t('sessionWizard.contractDefault', { n: i + 1 })}
                                  className={`${CLS.input} w-full`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#808080] mb-0.5">{t('sessionWizard.addressLabel')}</p>
                                <input
                                  value={c.address}
                                  onChange={e => updateBlacklistContract(i, "address", e.target.value)}
                                  placeholder="0x..."
                                  className={`${CLS.input} w-full font-mono ${blacklistErrors[i] ? "border-red-600" : ""}`}
                                />
                                {blacklistErrors[i] && <p className="text-sm text-red-600 mt-0.5">{blacklistErrors[i]}</p>}
                              </div>
                              <div className="flex items-end pb-0.5 shrink-0">
                                <Btn small onClick={() => removeBlacklistContract(i)}>✕</Btn>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Btn small onClick={addBlacklistContract} className="mt-1">
                          <PlusIcon /> {t('sessionWizard.addBlacklistContract')}
                        </Btn>
                      </GroupBox>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══ STEP 3 ══ */}
            {step === 3 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <StepBadge n={3} />
                  <div>
                    <p className="font-bold text-sm">{t('sessionWizard.aiBehavior')}</p>
                    <p className="text-xs text-[#808080]">{t('sessionWizard.step3Desc')}</p>
                  </div>
                </div>

                <GroupBox label={t('sessionWizard.tradingPrefs')}>
                  <div className="mb-2">
                    <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.riskPrefLabel')}</p>
                    <div className="flex gap-0.5">
                      {(["Conservative", "Balanced", "Aggressive"] as const).map(r => (
                        <ToggleBtn key={r} value={r} active={riskPref === r} onClick={() => setRiskPref(r)}>{t(`sessionWizard.riskLevel.${r.toLowerCase()}`)}</ToggleBtn>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.slippageLabel')}</p>
                    <div className="flex items-center gap-1.5">
                      <input value={slippage} onChange={e => setSlippage(e.target.value)} className={`${CLS.input} w-[50px] font-mono`} />
                      <span>%</span>
                    </div>
                  </div>
                </GroupBox>

                <GroupBox label={t('sessionWizard.personality')}>
                  <div className="mb-2">
                    <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.toneLabel')}</p>
                    <div className="flex flex-wrap gap-0.5">
                      {(["Serious", "Friendly", "Playful", "Chaotic"] as const).map(v => (
                        <ToggleBtn key={v} value={v} active={tone === v} onClick={() => setTone(v)}>{t(`sessionWizard.personalityType.${v.toLowerCase()}`)}</ToggleBtn>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.verbosityLabel')}</p>
                    <div className="flex gap-0.5">
                      {(["Brief", "Normal", "Chatty"] as const).map(v => (
                        <ToggleBtn key={v} value={v} active={verbosity === v} onClick={() => setVerbosity(v)}>{t(`sessionWizard.verbosity.${v.toLowerCase()}`)}</ToggleBtn>
                      ))}
                    </div>
                  </div>
                </GroupBox>
              </div>
            )}

            {/* ══ STEP 4 ══ */}
            {step === 4 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <StepBadge n={4} />
                  <div>
                    <p className="font-bold text-sm">{t('sessionWizard.reviewAndSign')}</p>
                    <p className="text-xs text-[#808080]">{t('sessionWizard.step4Desc')}</p>
                  </div>
                </div>

                <GroupBox label={t('sessionWizard.configSummary')}>
                  {tokenId && (
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-[#808080]">{t('sessionWizard.selectedNft')}</span>
                      <span className="font-bold">Gotchipus #{tokenId}</span>
                    </div>
                  )}

                  <p className="font-bold text-sm mt-2 mb-1">{t('sessionWizard.spendingLimits')}</p>
                  <Sunken className="mb-2 space-y-0.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.durationLabel')}</span><span className="font-bold text-[#000080]">{expiration} {t('sessionWizard.daysUnit')}</span></div>
                    <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.summaryMaxPerTx')}</span><span className="font-bold text-[#000080]">{maxPerTx} PROS</span></div>
                    <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.summaryMaxPerSession')}</span><span className="font-bold text-[#000080]">{maxPerSession} PROS</span></div>
                    {dailyTransferLimitEnabled && <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.summaryDailyLimit')}</span><span className="font-bold text-[#000080]">{dailyLimit} PROS</span></div>}
                    {singleTxLimitEnabled && <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.summarySingleTxLimit')}</span><span className="font-bold text-[#000080]">{singleTxLimit} PROS</span></div>}
                  </Sunken>

                  <p className="font-bold text-sm mb-1">{t('sessionWizard.security')}</p>
                  <Sunken className="mb-2 space-y-0.5 text-sm">
                    {blockInfiniteApproval && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.blockInfiniteApproval')}</p>}
                    {dailyTransferLimitEnabled && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.summaryDailyEnabled')}</p>}
                    {singleTxLimitEnabled && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.summarySingleEnabled')}</p>}
                    {restrictTarget && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.restrictContracts')} ({t('sessionWizard.modeSuffix', { mode: whitelistMode ? t('sessionWizard.whitelist') : t('sessionWizard.blacklist') })})</p>}
                    {!blockInfiniteApproval && !dailyTransferLimitEnabled && !singleTxLimitEnabled && !restrictTarget && (
                      <p className="text-xs text-[#808080]">{t('sessionWizard.noRestrictions')}</p>
                    )}
                  </Sunken>

                  {restrictTarget && (
                    <Sunken className="mb-2">
                      {compiledWhitelist.length > 0 && (
                        <>
                          <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.whitelistContractsLabel')}</p>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {whitelistContracts.filter(c => c.address && isValidAddress(c.address)).map((c, i) => (
                              <span key={i} className={`px-2 py-0.5 text-xs bg-[#e0e0e0] ${CLS.raised}`}>{c.name || c.address}</span>
                            ))}
                          </div>
                        </>
                      )}
                      {compiledBlacklist.length > 0 && (
                        <>
                          <p className="text-xs text-[#808080] mb-1">{t('sessionWizard.blacklistContractsLabel')}</p>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {blacklistContracts.filter(c => c.address && isValidAddress(c.address)).map((c, i) => (
                              <span key={i} className={`px-2 py-0.5 text-xs bg-[#ffdddd] ${CLS.raised}`}>{c.name || c.address}</span>
                            ))}
                          </div>
                        </>
                      )}
                      {compiledWhitelist.length === 0 && compiledBlacklist.length === 0 && (
                        <p className="text-xs text-[#808080]">{t('sessionWizard.noContracts')}</p>
                      )}
                    </Sunken>
                  )}

                  <p className="font-bold text-sm mb-1">{t('sessionWizard.aiBehavior')}</p>
                  <Sunken className="space-y-0.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.toneLabel')}</span><span>{t(`sessionWizard.personalityType.${tone.toLowerCase()}`)}</span></div>
                    <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.verbosityLabel')}</span><span>{t(`sessionWizard.verbosity.${verbosity.toLowerCase()}`)}</span></div>
                    <div className="flex justify-between"><span className="text-[#808080]">{t('sessionWizard.riskLabel')}</span><span>{t(`sessionWizard.riskLevel.${riskPref.toLowerCase()}`)} · {t('sessionWizard.slippageSuffix', { n: slippage })}</span></div>
                  </Sunken>
                </GroupBox>

                {activeSession && (
                  <div className="px-2.5 py-1.5 bg-[#ffffd0] border border-[#c0c080] text-xs space-y-0.5">
                    <p className="font-bold text-[#000080]">{t('sessionWizard.activeSessionFound')}</p>
                    <p className="text-[#000080]">{t('sessionWizard.replaceSession')}</p>
                    <p className="text-[#808080]">{t('sessionWizard.expires', { date: new Date(activeSession.expires_at).toLocaleString() })}</p>
                  </div>
                )}

                {/* Creation progress */}
                {isCreating && (
                  <GroupBox label={t('sessionWizard.progress')}>
                    <div className="space-y-1">
                      <StepStatus label={t('sessionWizard.progressSteps.eip712')} status={getStepStatus(creationStep, 'signing')} />
                      <StepStatus label={t('sessionWizard.progressSteps.createOnchain')} status={getStepStatus(creationStep, 'contract')} />
                      <StepStatus label={t('sessionWizard.progressSteps.waitConfirm')} status={getStepStatus(creationStep, 'confirming')} />
                      <StepStatus label={t('sessionWizard.progressSteps.saveSession')} status={getStepStatus(creationStep, 'api')} />
                    </div>
                    {txHash && (
                      <p className="text-xs text-[#808080] mt-1.5 font-mono break-all">{t('sessionWizard.txLabel')} {txHash}</p>
                    )}
                  </GroupBox>
                )}

                {signError && (
                  <div className="px-2.5 py-1.5 bg-red-50 border border-red-400 text-xs">
                    <p className="font-bold text-red-700 mb-0.5">{t('sessionWizard.failed')}</p>
                    <p className="text-red-600">{signError.message}</p>
                  </div>
                )}

                {!isCreating && !signError && (
                  <div className="px-2.5 py-1.5 bg-[#ffffee] border border-[#e0e0c0] text-xs">
                    {t('sessionWizard.signatureInfo')}
                  </div>
                )}
              </div>
            )}
          </GroupBox>

          {/* Navigation */}
          <div className="flex justify-between mt-2">
            <Btn onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
              {step > 1 ? `‹ ${t('common.back')}` : t('common.cancel')}
            </Btn>
            {step < TOTAL_STEPS ? (
              <Btn primary onClick={() => setStep(step + 1)}>{t('common.next')} ›</Btn>
            ) : (
              <Btn
                primary
                variant="sign"
                onClick={handleComplete}
                className={(!isReady || !tokenId || isCreating) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
              >
                {isCreating ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {creationStep === 'signing' && t('sessionWizard.signing')}
                    {creationStep === 'contract' && t('sessionWizard.confirmTx')}
                    {creationStep === 'confirming' && t('sessionWizard.confirming')}
                    {creationStep === 'api' && t('sessionWizard.saving')}
                    {creationStep === 'idle' && t('sessionWizard.processing')}
                  </>
                ) : !isReady ? (
                  t('common.loading')
                ) : (
                  t('sessionWizard.signCreate')
                )}
              </Btn>
            )}
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="w-[200px] shrink-0 flex flex-col gap-2">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2.5 py-1.5 text-white text-sm font-bold">
            {t('sessionWizard.sessionPreview')}
          </div>

          {tokenId && (
            <GroupBox label={t('sessionWizard.selectedGotchi')} className="relative">
              {step >= 1 && <span className="absolute -top-0.5 right-2 text-[#008000] text-sm">✓</span>}
              <Sunken>
                <div className="flex justify-between text-xs">
                  <span className="text-[#808080]">{t('sessionWizard.tokenId')}</span>
                  <span className="font-bold text-[#000080]">#{tokenId}</span>
                </div>
              </Sunken>
            </GroupBox>
          )}

          <GroupBox label={t('sessionWizard.sessionSettings')} className="relative">
            {step >= 2 && <span className="absolute -top-0.5 right-2 text-[#008000] text-sm">✓</span>}
            <Sunken className="space-y-0.5">
              <div className="flex justify-between text-xs"><span className="text-[#808080]">{t('sessionWizard.expirationLabel')}</span><span className="font-bold text-[#000080]">{expiration} {t('sessionWizard.daysUnit')}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#808080]">{t('sessionWizard.maxPerTx')}</span><span className="font-bold text-[#000080]">{maxPerTx} PROS</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#808080]">{t('sessionWizard.maxPerSession')}</span><span className="font-bold text-[#000080]">{maxPerSession} PROS</span></div>
            </Sunken>
          </GroupBox>

          <GroupBox label={t('sessionWizard.security')} className="relative">
            {step >= 3 && <span className="absolute -top-0.5 right-2 text-[#008000] text-sm">✓</span>}
            <Sunken className="space-y-0.5">
              {blockInfiniteApproval && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.previewBlockApprovals')}</p>}
              {dailyTransferLimitEnabled && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.previewDailyLimit', { n: dailyLimit })}</p>}
              {singleTxLimitEnabled && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.previewTxLimit', { n: singleTxLimit })}</p>}
              {restrictTarget && <p className="text-xs text-[#008000]">✓ {t('sessionWizard.modeSuffix', { mode: whitelistMode ? t('sessionWizard.whitelist') : t('sessionWizard.blacklist') })}</p>}
              {!blockInfiniteApproval && !dailyTransferLimitEnabled && !singleTxLimitEnabled && !restrictTarget && (
                <p className="text-xs text-[#808080]">{t('sessionWizard.noRestrictions')}</p>
              )}
            </Sunken>
          </GroupBox>

          <div className={`${CLS.sunken} p-1.5 bg-[#ffffee]`}>
            <p className="text-sm text-[#808080]">{t('sessionWizard.sessionKeysInfo')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
