import { Contact, Cosigner, ContactColor } from '../../shared/types';

/**
 * Auto-match a cosigner to a contact from the address book
 * Matches by xpub (primary) or fingerprint (fallback)
 */
export function matchCosignerToContact(
  cosigner: Cosigner,
  contacts: Contact[]
): Contact | null {
  if (!contacts || contacts.length === 0) {
    return null;
  }

  // Try to match by xpub first (most reliable)
  if (cosigner.xpub) {
    const xpubMatch = contacts.find((contact) => contact.xpub === cosigner.xpub);
    if (xpubMatch) {
      return xpubMatch;
    }
  }

  // Fallback: Try to match by fingerprint
  if (cosigner.fingerprint) {
    const fingerprintMatch = contacts.find(
      (contact) => contact.xpubFingerprint === cosigner.fingerprint
    );
    if (fingerprintMatch) {
      return fingerprintMatch;
    }
  }

  return null;
}

/**
 * Generate a consistent color for a cosigner based on their fingerprint
 * Used as fallback when no contact match is found
 */
export function generateCosignerColor(fingerprint: string): ContactColor {
  const colors: ContactColor[] = [
    'blue',
    'purple',
    'pink',
    'red',
    'orange',
    'yellow',
    'green',
    'teal',
    'cyan',
    'indigo',
    'violet',
    'magenta',
    'amber',
    'lime',
    'emerald',
    'sky',
  ];

  // Use fingerprint to generate consistent index
  // Remove spaces and convert to number
  const cleanFingerprint = fingerprint.replace(/\s/g, '');
  let hash = 0;
  for (let i = 0; i < cleanFingerprint.length; i++) {
    hash = cleanFingerprint.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get display info for a cosigner (name, color) with contact integration
 */
export interface CosignerDisplayInfo {
  name: string;
  color: ContactColor;
  hasContact: boolean;
  contactId?: string;
}

export function getCosignerDisplayInfo(
  cosigner: Cosigner,
  contacts: Contact[]
): CosignerDisplayInfo {
  const matchedContact = matchCosignerToContact(cosigner, contacts);

  if (matchedContact) {
    return {
      name: matchedContact.name,
      color: matchedContact.color || generateCosignerColor(cosigner.fingerprint),
      hasContact: true,
      contactId: matchedContact.id,
    };
  }

  return {
    name: cosigner.name,
    color: generateCosignerColor(cosigner.fingerprint),
    hasContact: false,
  };
}
