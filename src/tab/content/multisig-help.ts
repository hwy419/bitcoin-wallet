/**
 * Multi-Signature Wallet Help Content
 *
 * This file contains all user-facing educational content for multisig wallets.
 * Content is written in plain language to be accessible to non-technical users.
 *
 * Usage: Import and use these strings in UI components to provide consistent
 * help text and explanations throughout the multisig wallet experience.
 */

import { MultisigConfig, MultisigAddressType } from '../../shared/types';

// ============================================================================
// GENERAL EXPLANATIONS
// ============================================================================

export const MULTISIG_INTRO = {
  title: 'What are Multi-Signature Wallets?',

  shortDescription:
    'A multi-signature wallet requires multiple people to approve a transaction before it can be sent.',

  analogyTitle: 'Think of it like...',
  analogy:
    'A safe deposit box that requires 2 out of 3 keys to open. No single person can access the funds alone.',

  benefits: [
    {
      icon: '🔒',
      title: 'Enhanced Security',
      description: 'No single point of failure - one compromised key doesn\'t mean lost funds',
    },
    {
      icon: '🤝',
      title: 'Shared Control',
      description: 'Perfect for business partnerships, family accounts, or joint finances',
    },
    {
      icon: '🛡️',
      title: 'Backup Protection',
      description: 'Lose one key? Still access your funds with the remaining keys (for 2-of-3 and 3-of-5)',
    },
  ],

  whenToUse: [
    'Securing large amounts of Bitcoin',
    'Business or organizational accounts',
    'Shared family finances',
    'Adding backup keys for personal security',
    'Inheritance planning',
  ],

  whenNotToUse: [
    'Small amounts or everyday spending',
    'If you need to send transactions quickly',
    'If coordinating with co-signers is difficult',
  ],
};

// ============================================================================
// CONFIGURATION DETAILS
// ============================================================================

export const MULTISIG_CONFIGS: Record<MultisigConfig, {
  displayName: string;
  emoji: string;
  tagline: string;
  description: string;
  howItWorks: string;
  requiredSignatures: number;
  totalSigners: number;
  riskLevel: 'high' | 'low' | 'very-low';
  riskExplanation: string;
  bestFor: string[];
  examples: string[];
  warnings: string[];
  recommendation?: string;
}> = {
  '2-of-2': {
    displayName: '2-of-2 Multisig',
    emoji: '🔐',
    tagline: 'Personal Security',
    description: 'Both signatures are required for every transaction',
    howItWorks: 'You control both keys (e.g., one on your laptop, one on your phone). Both must sign every transaction.',
    requiredSignatures: 2,
    totalSigners: 2,
    riskLevel: 'high',
    riskExplanation: 'If you lose ONE key, your funds are permanently locked. There is no recovery option.',
    bestFor: [
      'Personal multi-device security',
      'Users who are very careful with backups',
      'Testing multisig before using larger amounts',
    ],
    examples: [
      'Laptop + Phone',
      'Desktop + Hardware wallet',
      'Personal device + Backup device',
    ],
    warnings: [
      '⚠️ CRITICAL: Losing one key means permanent loss of funds',
      '⚠️ No recovery option if one key is lost',
      '⚠️ Both devices must be available to send transactions',
    ],
  },

  '2-of-3': {
    displayName: '2-of-3 Multisig',
    emoji: '⭐',
    tagline: 'Recommended - Shared Account with Backup',
    description: 'Any 2 out of 3 signatures are required to send funds',
    howItWorks: 'Three people (or devices) each hold one key. Any two can approve a transaction. One key can be lost safely.',
    requiredSignatures: 2,
    totalSigners: 3,
    riskLevel: 'low',
    riskExplanation: 'You can safely lose ONE key and still access your funds with the other two.',
    bestFor: [
      'Business partnerships (2 partners + 1 backup)',
      'Family accounts (parents + trusted family member)',
      'Personal security with backup (device + backup device + trusted person)',
      'Most users wanting enhanced security',
    ],
    examples: [
      'You + Partner + Lawyer (backup)',
      'Alice + Bob + Carol (any 2 can sign)',
      'Phone + Laptop + Hardware wallet',
    ],
    warnings: [
      'ℹ️ Losing TWO keys means funds are locked',
      'ℹ️ Requires coordination with at least one other person',
    ],
    recommendation: 'This is the recommended configuration for most users. It provides excellent security with built-in backup protection.',
  },

  '3-of-5': {
    displayName: '3-of-5 Multisig',
    emoji: '🏢',
    tagline: 'Organization / Business',
    description: 'Any 3 out of 5 signatures are required to send funds',
    howItWorks: 'Five people each hold one key. Any three must agree to approve a transaction. Two keys can be lost safely.',
    requiredSignatures: 3,
    totalSigners: 5,
    riskLevel: 'very-low',
    riskExplanation: 'You can safely lose TWO keys and still access your funds with the remaining three.',
    bestFor: [
      'Organizations and DAOs',
      'Corporate treasuries',
      'Board-controlled funds',
      'Large investment groups',
    ],
    examples: [
      '5 board members, any 3 must approve',
      '5 executives, majority required for spending',
      '3 owners + 2 advisors',
    ],
    warnings: [
      'ℹ️ Requires significant coordination',
      'ℹ️ More complex setup process',
      'ℹ️ Higher transaction fees due to more signatures',
    ],
  },
};

// ============================================================================
// ADDRESS TYPE EXPLANATIONS
// ============================================================================

export const ADDRESS_TYPES: Record<MultisigAddressType, {
  displayName: string;
  fullName: string;
  description: string;
  prefix: { testnet: string; mainnet: string };
  feeLevel: 'lowest' | 'lower' | 'higher';
  compatibility: 'maximum' | 'good' | 'modern';
  technicalName: string;
  pros: string[];
  cons: string[];
  whenToChoose: string;
  recommendation?: boolean;
}> = {
  'p2wsh': {
    displayName: 'Native SegWit',
    fullName: 'Pay-to-Witness-Script-Hash (P2WSH)',
    description: 'Modern, most efficient multisig format',
    prefix: { testnet: 'tb1', mainnet: 'bc1' },
    feeLevel: 'lowest',
    compatibility: 'modern',
    technicalName: 'P2WSH',
    pros: [
      '✓ Lowest transaction fees (40% cheaper than legacy)',
      '✓ Most efficient use of blockchain space',
      '✓ Better error detection (Bech32 encoding)',
      '✓ Future-proof format',
    ],
    cons: [
      '⚠ Not supported by very old wallets (rare in 2025)',
      '⚠ Some exchanges may not support deposits (improving)',
    ],
    whenToChoose: 'Choose this unless your co-signers specifically cannot support it',
    recommendation: true,
  },

  'p2sh-p2wsh': {
    displayName: 'Wrapped SegWit',
    fullName: 'P2SH-wrapped P2WSH',
    description: 'SegWit benefits with broader compatibility',
    prefix: { testnet: '2', mainnet: '3' },
    feeLevel: 'lower',
    compatibility: 'good',
    technicalName: 'P2SH-P2WSH',
    pros: [
      '✓ Lower fees than legacy (30% cheaper)',
      '✓ Compatible with most wallets',
      '✓ SegWit benefits in a familiar format',
    ],
    cons: [
      '⚠ Slightly higher fees than Native SegWit',
      '⚠ More complex than other formats',
    ],
    whenToChoose: 'Choose if co-signers need better compatibility but want SegWit benefits',
  },

  'p2sh': {
    displayName: 'Legacy',
    fullName: 'Pay-to-Script-Hash (P2SH)',
    description: 'Original multisig format, maximum compatibility',
    prefix: { testnet: '2', mainnet: '3' },
    feeLevel: 'higher',
    compatibility: 'maximum',
    technicalName: 'P2SH',
    pros: [
      '✓ Works with all wallets',
      '✓ Universally accepted by exchanges',
      '✓ Time-tested format',
    ],
    cons: [
      '⚠ Higher transaction fees',
      '⚠ Less efficient than SegWit',
      '⚠ Older technology',
    ],
    whenToChoose: 'Only choose if co-signers require it for compatibility',
  },
};

// ============================================================================
// KEY CONCEPTS GLOSSARY
// ============================================================================

export const GLOSSARY = {
  xpub: {
    term: 'Extended Public Key (xpub)',
    shortDefinition: 'Your PUBLIC key that you share with co-signers',
    fullDefinition:
      'An extended public key (xpub) is a special Bitcoin key that allows others to generate your receive addresses without having access to spend your funds. It\'s completely safe to share.',
    whatItLooksLike: 'A long string starting with "tpub" (testnet) or "xpub" (mainnet)',
    safe: 'Yes - Safe to share with co-signers',
    neverShare: 'Your seed phrase or private keys',
  },

  fingerprint: {
    term: 'Key Fingerprint',
    shortDefinition: 'A unique identifier for a key (like a digital fingerprint)',
    fullDefinition:
      'A short code that uniquely identifies a key. Used to verify you have the correct xpub from each co-signer.',
    whatItLooksLike: '8 characters like "A1B2C3D4"',
    purpose: 'Prevents man-in-the-middle attacks by allowing you to verify keys match',
  },

  psbt: {
    term: 'PSBT (Partially Signed Bitcoin Transaction)',
    shortDefinition: 'A transaction that needs more signatures before it can be sent',
    fullDefinition:
      'PSBT is a standard format for multisig transactions. It\'s like a digital contract that gets passed between co-signers. Each person adds their signature until enough signatures are collected.',
    analogy: 'Like a paper form that needs multiple signatures before being submitted',
    storage: 'Temporarily stored in your browser. Export as backup!',
  },

  redeemScript: {
    term: 'Redeem Script',
    shortDefinition: 'The rules that define how funds can be spent',
    fullDefinition:
      'A script that specifies which public keys can spend the funds and how many signatures are required. It\'s created automatically when you set up a multisig wallet.',
    userAction: 'Nothing - This is handled automatically',
  },

  cosigner: {
    term: 'Co-signer',
    shortDefinition: 'Someone who shares control of the multisig wallet',
    fullDefinition:
      'A person (or device) that holds one of the keys in a multisig setup. All co-signers must create the same multisig configuration to generate matching addresses.',
    yourRole: 'You are one of the co-signers',
  },

  bip48: {
    term: 'BIP48',
    shortDefinition: 'The standard for multisig wallet key derivation',
    fullDefinition:
      'A Bitcoin standard that ensures all co-signers derive keys in the same way. This is why everyone generates identical addresses.',
    userAction: 'Nothing - This happens automatically',
  },

  bip67: {
    term: 'BIP67',
    shortDefinition: 'The standard for sorting public keys',
    fullDefinition:
      'A Bitcoin standard that sorts public keys in a specific order. This ensures all co-signers generate the same multisig address, regardless of the order they add keys.',
    userAction: 'Nothing - Keys are sorted automatically',
  },
};

// ============================================================================
// STEP-BY-STEP GUIDES
// ============================================================================

export const SETUP_GUIDE = {
  title: 'Setting Up Your First Multisig Wallet',

  steps: [
    {
      number: 1,
      title: 'Choose Configuration',
      description: 'Decide how many signatures you need (we recommend 2-of-3)',
      whatYouNeed: 'Think about who will be co-signers',
      timeEstimate: '2 minutes',
    },
    {
      number: 2,
      title: 'Choose Address Type',
      description: 'Select Native SegWit unless co-signers need compatibility',
      whatYouNeed: 'Check if co-signers support Native SegWit',
      timeEstimate: '1 minute',
    },
    {
      number: 3,
      title: 'Export Your xpub',
      description: 'Copy or show QR code to send to co-signers',
      whatYouNeed: 'Secure way to send xpub (Signal, encrypted email, or in-person)',
      timeEstimate: '2 minutes',
    },
    {
      number: 4,
      title: 'Collect Co-signer xpubs',
      description: 'Import xpubs from all other co-signers',
      whatYouNeed: 'xpubs from all co-signers (they must create same configuration)',
      timeEstimate: '5-10 minutes',
    },
    {
      number: 5,
      title: 'Verify Fingerprints',
      description: 'Check key fingerprints with co-signers (via phone/video)',
      whatYouNeed: 'Phone or video call with each co-signer',
      timeEstimate: '5 minutes',
      critical: true,
      whyCritical: 'This prevents man-in-the-middle attacks',
    },
    {
      number: 6,
      title: 'Create Wallet',
      description: 'Finalize creation and verify first address matches',
      whatYouNeed: 'All co-signers should have same first address',
      timeEstimate: '2 minutes',
    },
  ],

  totalTime: '15-25 minutes (first time)',
  difficulty: 'Medium',

  tips: [
    '💡 Test with small amount first',
    '💡 Save all co-signer xpubs as backup',
    '💡 Ensure all co-signers choose SAME configuration',
    '💡 Verify first address matches with all co-signers',
  ],
};

export const TRANSACTION_GUIDE = {
  title: 'Sending a Multisig Transaction',

  steps: [
    {
      number: 1,
      title: 'Create Transaction',
      description: 'Enter recipient address and amount like normal',
      note: 'This creates an unsigned PSBT',
    },
    {
      number: 2,
      title: 'Sign with Your Key',
      description: 'Add your signature to the transaction',
      note: 'You\'ll see "1 of 2" or "1 of 3" signatures collected',
    },
    {
      number: 3,
      title: 'Export PSBT',
      description: 'Save or share the partially signed transaction',
      options: ['QR code (for in-person)', 'Copy text (for messaging)', 'Download file (for air-gapped)'],
    },
    {
      number: 4,
      title: 'Share with Co-signers',
      description: 'Send PSBT to co-signers for their signatures',
      securityNote: 'Always verify transaction details with co-signers before they sign',
    },
    {
      number: 5,
      title: 'Collect Signatures',
      description: 'Import signed PSBTs from co-signers',
      note: 'Signatures are merged automatically',
    },
    {
      number: 6,
      title: 'Broadcast',
      description: 'Once enough signatures collected, transaction broadcasts automatically',
      note: 'Anyone can broadcast once threshold is met',
    },
  ],

  whoCanBroadcast: 'Anyone with a fully-signed PSBT can broadcast',

  tips: [
    '💡 Export PSBT as backup before sharing',
    '💡 Verify amount and recipient with co-signers',
    '💡 PSBTs expire after 30 days',
  ],
};

// ============================================================================
// SECURITY WARNINGS & BEST PRACTICES
// ============================================================================

export const SECURITY_WARNINGS = {
  critical: [
    {
      icon: '🔴',
      title: 'NEVER share your seed phrase',
      description: 'Only share your xpub (public key). Never share your 12-word seed phrase or private keys.',
    },
    {
      icon: '🔴',
      title: 'ALWAYS verify fingerprints',
      description: 'Check key fingerprints with co-signers via phone or video call to prevent tampering.',
    },
    {
      icon: '🔴',
      title: 'VERIFY transaction details before signing',
      description: 'Always double-check the recipient address and amount with co-signers before signing.',
    },
  ],

  important: [
    {
      icon: '🟡',
      title: 'Test with small amounts first',
      description: 'Send a test transaction with 0.0001 BTC before using for large amounts.',
    },
    {
      icon: '🟡',
      title: 'Keep backups of all xpubs',
      description: 'Save all co-signer xpubs in a safe place. You\'ll need them for wallet recovery.',
    },
    {
      icon: '🟡',
      title: 'Export important PSBTs',
      description: 'PSBTs in browser storage may be lost. Export and save important unsigned transactions.',
    },
    {
      icon: '🟡',
      title: 'Store keys in different locations',
      description: 'Don\'t keep all keys in one place. Distribute them geographically if possible.',
    },
  ],

  recommendations: [
    'Use 2-of-3 instead of 2-of-2 for better backup protection',
    'Choose Native SegWit (P2WSH) for lowest fees',
    'Coordinate with co-signers about who holds which keys',
    'Have a plan for what happens if a co-signer is unavailable',
    'Document your multisig setup for emergency recovery',
  ],
};

export const COMMON_MISTAKES = [
  {
    mistake: 'Using different configurations',
    problem: 'Co-signers create different M-of-N setups',
    symptom: 'Addresses don\'t match between wallets',
    solution: 'All co-signers must choose SAME configuration (e.g., all choose 2-of-3)',
  },
  {
    mistake: 'Using different address types',
    problem: 'Some choose P2WSH, others choose P2SH',
    symptom: 'Addresses don\'t match',
    solution: 'All co-signers must choose SAME address type',
  },
  {
    mistake: 'Adding keys in different order',
    problem: 'Trying to control key order manually',
    symptom: 'Unnecessary - keys are sorted automatically (BIP67)',
    solution: 'Key order doesn\'t matter - sorting is automatic',
  },
  {
    mistake: 'Not verifying fingerprints',
    problem: 'Importing wrong xpub or tampered xpub',
    symptom: 'Security vulnerability',
    solution: 'Always verify fingerprints via phone/video call',
  },
  {
    mistake: 'Losing PSBTs',
    problem: 'Not exporting PSBT before browser reset',
    symptom: 'Transaction lost, need to recreate',
    solution: 'Export PSBTs as backup immediately after creating',
  },
];

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

export const TROUBLESHOOTING = {
  addressesDontMatch: {
    question: 'My address doesn\'t match my co-signer\'s address',
    possibleCauses: [
      'Different M-of-N configuration (you chose 2-of-3, they chose 2-of-2)',
      'Different address type (you chose P2WSH, they chose P2SH)',
      'Wrong xpubs imported',
      'Different derivation paths',
    ],
    solution: 'Verify with co-signers: (1) Same configuration, (2) Same address type, (3) Correct xpubs, (4) Same account index',
  },

  lostOneKey: {
    question: 'I lost one of my keys, can I still access funds?',
    answer: {
      '2-of-2': 'No - funds are permanently locked. This is why 2-of-3 is recommended.',
      '2-of-3': 'Yes - you can use the remaining 2 keys to access funds.',
      '3-of-5': 'Yes - you can use any 3 of the remaining 4 keys.',
    },
    prevention: 'Use 2-of-3 or 3-of-5 configuration for backup protection',
  },

  psbtImportFailed: {
    question: 'PSBT import says "invalid signature"',
    possibleCauses: [
      'Co-signer signed a different transaction',
      'PSBT was corrupted during transfer',
      'Wrong multisig account',
      'Co-signer\'s keys don\'t match',
    ],
    solution: 'Ask co-signer to re-sign and export fresh PSBT. Verify transaction details match.',
  },

  cantBroadcast: {
    question: 'Transaction won\'t broadcast',
    possibleCauses: [
      'Not enough signatures collected',
      'Transaction no longer valid (inputs spent elsewhere)',
      'Network connectivity issue',
      'Fees too low',
    ],
    solution: 'Check signature count, verify inputs still unspent, check internet connection',
  },
};

// ============================================================================
// EXPORT ALL CONTENT
// ============================================================================

export const MULTISIG_HELP_CONTENT = {
  intro: MULTISIG_INTRO,
  configs: MULTISIG_CONFIGS,
  addressTypes: ADDRESS_TYPES,
  glossary: GLOSSARY,
  setupGuide: SETUP_GUIDE,
  transactionGuide: TRANSACTION_GUIDE,
  security: SECURITY_WARNINGS,
  commonMistakes: COMMON_MISTAKES,
  troubleshooting: TROUBLESHOOTING,
};

export default MULTISIG_HELP_CONTENT;
