/**
 * ConfigSelector - Multisig Configuration Selection Component
 *
 * Allows users to choose between 2-of-2, 2-of-3, and 3-of-5 multisig configurations.
 * Provides clear explanations, use cases, and recommendations to help users make
 * an informed decision.
 *
 * Features:
 * - Visual cards for each configuration
 * - Risk level indicators
 * - Use case examples
 * - Warnings for high-risk options
 * - Recommended option highlighted
 */

import React, { useState } from 'react';
import { MultisigConfig } from '../../../shared/types';
import { MULTISIG_CONFIGS } from '../../content/multisig-help';

interface ConfigSelectorProps {
  selectedConfig?: MultisigConfig;
  onSelect: (config: MultisigConfig) => void;
  onContinue: () => void;
  showContinueButton?: boolean;
}

export const ConfigSelector: React.FC<ConfigSelectorProps> = ({
  selectedConfig,
  onSelect,
  onContinue,
  showContinueButton = true,
}) => {
  const [expandedConfig, setExpandedConfig] = useState<MultisigConfig | null>(null);

  const configs: MultisigConfig[] = ['2-of-2', '2-of-3', '3-of-5'];

  const getRiskColor = (riskLevel: 'high' | 'low' | 'very-low'): string => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-400 bg-red-500/15 border border-red-500/30';
      case 'low':
        return 'text-amber-400 bg-amber-500/15 border border-amber-500/30';
      case 'very-low':
        return 'text-green-400 bg-green-500/15 border border-green-500/30';
    }
  };

  const getRiskLabel = (riskLevel: 'high' | 'low' | 'very-low'): string => {
    switch (riskLevel) {
      case 'high':
        return 'Higher Risk if Key Lost';
      case 'low':
        return 'Low Risk';
      case 'very-low':
        return 'Very Low Risk';
    }
  };

  const toggleExpanded = (config: MultisigConfig) => {
    setExpandedConfig(expandedConfig === config ? null : config);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Multisig Configuration
        </h2>
        <p className="text-gray-400">
          Select how many signatures will be required to send Bitcoin
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="space-y-4">
        {configs.map((config) => {
          const details = MULTISIG_CONFIGS[config];
          const isSelected = selectedConfig === config;
          const isExpanded = expandedConfig === config;
          const isRecommended = config === '2-of-3';

          return (
            <div
              key={config}
              className={`
                relative rounded-2xl border-2 p-6 cursor-pointer transition-all
                ${isSelected
                  ? 'border-bitcoin bg-gray-850'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-850'
                }
              `}
              onClick={() => onSelect(config)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-bitcoin text-white shadow-glow-bitcoin">
                    ⭐ Recommended
                  </span>
                </div>
              )}

              {/* Radio Button */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'}
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{details.emoji}</span>
                      <h3 className="text-lg font-semibold text-white">
                        {details.displayName}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(
                        details.riskLevel
                      )}`}
                    >
                      {getRiskLabel(details.riskLevel)}
                    </span>
                  </div>

                  {/* Tagline */}
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    {details.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-3">{details.description}</p>

                  {/* Signature Info */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300 mb-3">
                    <span className="font-semibold">
                      {details.requiredSignatures} of {details.totalSigners}
                    </span>
                    <span>signatures required</span>
                  </div>

                  {/* Best For */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-300 mb-1">Best for:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {details.bestFor.slice(0, 2).map((use, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{use}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(config);
                    }}
                    className="text-sm text-bitcoin hover:text-bitcoin-light font-medium flex items-center space-x-1"
                  >
                    <span>{isExpanded ? 'Show less' : 'Learn more'}</span>
                    <span>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                      {/* How it works */}
                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-1">
                          How it works:
                        </p>
                        <p className="text-xs text-gray-400">{details.howItWorks}</p>
                      </div>

                      {/* Examples */}
                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-1">
                          Examples:
                        </p>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {details.examples.map((example, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-1">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Explanation */}
                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-1">
                          Risk level:
                        </p>
                        <p className="text-xs text-gray-400">{details.riskExplanation}</p>
                      </div>

                      {/* Warnings */}
                      {details.warnings.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                          <p className="text-xs font-semibold text-amber-400 mb-2">
                            Important considerations:
                          </p>
                          <ul className="text-xs text-amber-400/80 space-y-1">
                            {details.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendation */}
                      {details.recommendation && (
                        <div className="bg-bitcoin/10 border border-bitcoin/30 rounded p-3">
                          <p className="text-xs text-bitcoin">{details.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-blue-400 mb-1">
              Not sure which to choose?
            </p>
            <p className="text-sm text-blue-400/80">
              We recommend <strong>2-of-3 Multisig</strong> for most users. It provides
              excellent security with built-in backup protection. You can safely lose one key
              and still access your funds.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      {showContinueButton && (
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedConfig}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${selectedConfig
                ? 'bg-bitcoin hover:bg-bitcoin-hover text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }
            `}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfigSelector;
