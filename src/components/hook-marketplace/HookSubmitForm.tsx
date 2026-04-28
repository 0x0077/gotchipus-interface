'use client'

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HookCategory } from '@src/types/hook';
import { hookApi } from '@src/services/hookApi';
import { CreateHookRequest } from '@src/types/hook-api';
import { useAccount } from 'wagmi';
import { Win98Select } from '@src/components/ui/win98-select';
import { validateHookSourceCode } from '@src/utils/hookValidation';
import CloseIcon from '@assets/icons/CloseIcon';
import RightIcon from '@assets/icons/rightIcon';

interface HookSubmitFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const HookSubmitForm = ({ onClose, onSuccess }: HookSubmitFormProps) => {
  const { t } = useTranslation();
  const { address: walletAddress } = useAccount();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceCodeValidation, setSourceCodeValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as HookCategory | '',
    description: '',
    tags: '',
    address: '',
    sourceCode: '',
    abi: '',
    features: '',
    usageExample: '',
    documentationUrl: '',
    githubUrl: ''
  });

  const categories: { value: HookCategory; label: string }[] = [
    { value: 'reward', label: t('hookRank.reward') },
    { value: 'social', label: t('hookRank.social') },
    { value: 'defi', label: t('hookRank.defi') },
    { value: 'rwa', label: t('hookRank.rwa') },
    { value: 'automation', label: t('hookRank.automation') },
    { value: 'security', label: t('hookRank.securityCat') }
  ];

  const handleSubmit = async () => {
    if (!walletAddress) {
      setError(t('hookSubmit.connectWalletError'));
      return;
    }

    if (!formData.category) {
      setError(t('hookSubmit.selectCategoryError'));
      return;
    }

    const validation = validateHookSourceCode(formData.sourceCode);
    if (!validation.isValid) {
      setError(validation.error || t('hookSubmit.invalidSourceError'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const createRequest: CreateHookRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        icon: '',
        address: formData.address.toLowerCase(),
        chain_id: 1672,
        source_code: formData.sourceCode,
        abi: formData.abi || '[]',
        explorer_url: `https://pharosscan.xyz/address/${formData.address}`,
        creator: walletAddress.toLowerCase(),
        creator_name: '',
        is_audited: false,
        audit_report_url: '',
        is_verified: false,
        usage_count: 0,
        rating: 0,
        review_count: 0,
        features: formData.features.split('\n').map(f => f.trim()).filter(Boolean),
        usage_example: formData.usageExample,
        documentation_url: formData.documentationUrl,
        github_url: formData.githubUrl,
        hook_points: [],
        version: '1.0.0'
      };

      await hookApi.createHook(createRequest);

      if (onSuccess) {
        await onSuccess();
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || t('hookSubmit.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-win98-face border-4 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-[#000080] text-white font-bold flex items-center justify-between px-2 py-1">
          <span>{t('hookSubmit.title')}</span>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-win98-face border border-[#808080] shadow-win98-outer flex items-center justify-center hover:bg-[#d4d0c8] text-black font-bold"
          >
            <CloseIcon width={14} height={14} color="#000000" />
          </button>
        </div>

        <div className="p-4 border-b-2 border-[#808080]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">
              {t('sessionWizard.stepOf', { step, total: totalSteps })}
            </span>
            <span className="text-xs text-[#808080]">
              {step === 1 && t('sessionWizard.steps.basicInfo')}
              {step === 2 && t('sessionWizard.steps.contractDetails')}
              {step === 3 && t('sessionWizard.steps.additionalInfo')}
              {step === 4 && t('sessionWizard.steps.previewSubmit')}
            </span>
          </div>
          <div className="h-4 border-2 border-[#808080] shadow-win98-inner bg-white">
            <div
              className="h-full bg-[#000080] transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="border-2 border-[#ff0000] bg-[#ffe0e0] p-3 mb-4">
              <p className="text-sm text-[#ff0000] font-bold">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="win98-group-box">
                <div className="win98-group-title text-xs font-bold">{t('sessionWizard.steps.basicInfo')}</div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      {t('hookSubmit.hookName')} <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm"
                      placeholder={t('hookSubmit.hookNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">
                      {t('hookSubmit.category')} <span className="text-red-600">*</span>
                    </label>
                    <Win98Select
                      size="md"
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value as HookCategory })}
                      options={categories}
                      placeholder={t('hookSubmit.categoryPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">
                      {t('hookSubmit.description')} <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm h-24 resize-none"
                      placeholder={t('hookSubmit.descriptionPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">{t('hookSubmit.tags')}</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm"
                      placeholder={t('hookSubmit.tagsPlaceholder')}
                    />
                    <p className="text-xs text-[#808080] mt-1">
                      {t('hookSubmit.tagsSeparator')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="win98-group-box">
                <div className="win98-group-title text-xs font-bold">{t('sessionWizard.steps.contractDetails')}</div>

                <div className="border-2 border-[#000080] bg-[#e0e0ff] px-3 py-2 mb-3">
                  <p className="text-xs font-bold text-[#000080]">
                    {t('hookSubmit.submitInfo')}
                  </p>
                  <p className="text-xs text-[#000080] mt-1">
                    {t('hookSubmit.submitInfoDesc')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      {t('hookSubmit.contractAddress')} <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm font-mono"
                      placeholder="0x..."
                    />
                    <p className="text-xs text-[#808080] mt-1">
                      {t('hookSubmit.contractAddressHelper')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">
                      {t('hookSubmit.sourceCode')} <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={formData.sourceCode}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData({ ...formData, sourceCode: newValue });
                        // Validate on change with debounce
                        if (newValue.length > 50) {
                          const validation = validateHookSourceCode(newValue);
                          setSourceCodeValidation(validation);
                        } else {
                          setSourceCodeValidation(null);
                        }
                      }}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-xs font-mono h-64 resize-none"
                    />

                    {sourceCodeValidation && (
                      <div className={`border-2 mt-2 px-3 py-2 ${
                        sourceCodeValidation.isValid
                          ? 'border-[#008000] bg-[#e0ffe0]'
                          : 'border-[#ff0000] bg-[#ffe0e0]'
                      }`}>
                        <p className={`text-xs font-bold ${
                          sourceCodeValidation.isValid
                            ? 'text-[#008000]'
                            : 'text-[#ff0000]'
                        }`}>
                          {sourceCodeValidation.isValid
                            ? `✓ ${t('hookSubmit.validContract')}`
                            : `✗ ${t('hookSubmit.invalidContract')}`}
                        </p>
                        {sourceCodeValidation.error && (
                          <p className="text-xs text-[#ff0000] mt-1">
                            {sourceCodeValidation.error}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="border-2 border-[#000080] bg-[#e0e0ff] px-3 py-2 mt-2">
                      <p className="text-xs font-bold text-[#000080] mb-1">
                        {t('hookSubmit.requiredStructure')}
                      </p>
                      <ul className="text-xs text-[#000080] space-y-1 list-disc list-inside">
                        <li>Import BaseHook (BeforeExecuteHook/AfterExecuteHook/FullHook)</li>
                        <li>Import IHook interface</li>
                        <li>Inherit from one of the base hook contracts</li>
                        <li>Include constructor with _gotchipus parameter</li>
                      </ul>
                    </div>

                    <p className="text-xs text-[#808080] mt-1">
                      {t('hookSubmit.sourceCodeHelper')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">
                      {t('hookSubmit.contractAbi')}
                    </label>
                    <textarea
                      value={formData.abi}
                      onChange={(e) => setFormData({ ...formData, abi: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-xs font-mono h-40 resize-none"
                    />
                    <p className="text-xs text-[#808080] mt-1">
                      {t('hookSubmit.contractAbiHelper')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="win98-group-box">
                <div className="win98-group-title text-xs font-bold">{t('sessionWizard.steps.additionalInfo')}</div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold mb-1">{t('hookSubmit.features')}</label>
                    <textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm h-20 resize-none"
                      placeholder="List key features (one per line)"
                    />
                    <p className="text-xs text-[#808080] mt-1">
                      {t('hookSubmit.featuresHelper')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">{t('hookSubmit.usageExample')}</label>
                    <textarea
                      value={formData.usageExample}
                      onChange={(e) => setFormData({ ...formData, usageExample: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-xs font-mono h-32 resize-none"
                      placeholder="// Example code showing how to use your hook"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">{t('hookSubmit.docUrl')}</label>
                    <input
                      type="url"
                      value={formData.documentationUrl}
                      onChange={(e) => setFormData({ ...formData, documentationUrl: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm"
                      placeholder="https://docs.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">{t('hookSubmit.githubUrl')}</label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className="w-full border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-sm"
                      placeholder="https://github.com/user/repo"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="win98-group-box">
                <div className="win98-group-title text-xs font-bold">{t('hookSubmit.preview')}</div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-bold">{t('hookSubmit.name')}</span> {formData.name || t('hookSubmit.notSet')}
                  </div>
                  <div>
                    <span className="font-bold">{t('hookSubmit.categoryLabel')}</span>{' '}
                    {formData.category ? categories.find(c => c.value === formData.category)?.label : t('hookSubmit.notSet')}
                  </div>
                  <div>
                    <span className="font-bold">{t('hookSubmit.descriptionLabel')}</span> {formData.description || t('hookSubmit.notSet')}
                  </div>
                  <div>
                    <span className="font-bold">{t('hookSubmit.tagsLabel')}</span> {formData.tags || t('hookSubmit.none')}
                  </div>
                  <div>
                    <span className="font-bold">{t('hookSubmit.contractLabel')}</span>{' '}
                    <code className="text-xs">{formData.address || t('hookSubmit.notSet')}</code>
                  </div>
                  <div>
                    <span className="font-bold">{t('hookSubmit.network')}</span>
                  </div>
                </div>
              </div>

              <div className="win98-group-box">
                <div className="win98-group-title text-xs font-bold">{t('hookSubmit.sourceValidation')}</div>
                {(() => {
                  const validation = validateHookSourceCode(formData.sourceCode);
                  return (
                    <div className={`border-2 px-3 py-2 ${
                      validation.isValid
                        ? 'border-[#008000] bg-[#e0ffe0]'
                        : 'border-[#ff0000] bg-[#ffe0e0]'
                    }`}>
                      <p className={`text-xs font-bold ${
                        validation.isValid
                          ? 'text-[#008000]'
                          : 'text-[#ff0000]'
                      }`}>
                        {validation.isValid
                          ? `✓ ${t('hookSubmit.readyToSubmit')}`
                          : `✗ ${t('hookSubmit.cannotSubmit')}`}
                      </p>
                      {validation.error && (
                        <p className="text-xs text-[#ff0000] mt-1">
                          {validation.error}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="border-t-2 border-[#808080] p-4 flex items-center justify-between bg-[#d4d0c8]">
          <button
            onClick={onClose}
            className="border-2 border-[#808080] shadow-win98-outer bg-win98-face hover:bg-[#d4d4d4] active:shadow-win98-inner px-4 py-2 text-sm font-bold"
          >
            {t('common.cancel')}
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="border-2 border-[#808080] shadow-win98-outer bg-win98-face hover:bg-[#d4d4d4] active:shadow-win98-inner px-4 py-2 text-sm font-bold flex items-center gap-2"
              >
                <RightIcon width={14} height={14} color="#000000" style={{ transform: 'scaleX(-1)' }} />
                <span>{t('hookSubmit.previous')}</span>
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                className="border-2 border-[#808080] shadow-win98-outer bg-[#000080] text-white hover:bg-[#000060] active:shadow-win98-inner px-4 py-2 text-sm font-bold flex items-center gap-2"
              >
                <span>{t('common.next')}</span>
                <RightIcon width={14} height={14} color="white" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !validateHookSourceCode(formData.sourceCode).isValid}
                className="border-2 border-[#808080] shadow-win98-outer bg-[#008000] text-white hover:bg-[#006000] active:shadow-win98-inner px-4 py-2 text-sm font-bold disabled:bg-[#808080] disabled:cursor-not-allowed disabled:hover:bg-[#808080]"
              >
                {loading ? t('hookSubmit.submitting') : t('hookSubmit.submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
