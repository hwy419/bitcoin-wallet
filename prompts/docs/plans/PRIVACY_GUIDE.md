# Bitcoin Wallet Privacy Guide

**Protecting Your Financial Privacy with Best Practices**

---

## Table of Contents

1. [Why Privacy Matters](#why-privacy-matters)
2. [Privacy Features in This Wallet](#privacy-features-in-this-wallet)
3. [Understanding Privacy Indicators](#understanding-privacy-indicators)
4. [Best Practices for Maximum Privacy](#best-practices-for-maximum-privacy)
5. [How Bitcoin Privacy Works](#how-bitcoin-privacy-works)
6. [Common Privacy Mistakes](#common-privacy-mistakes)
7. [Advanced Privacy Tips](#advanced-privacy-tips)
8. [FAQ](#faq)

---

## Why Privacy Matters

Bitcoin transactions are permanently recorded on a **public blockchain** that anyone can view. While your real identity isn't directly linked to your Bitcoin addresses, analyzing transaction patterns can reveal:

- **How much Bitcoin you own** - By tracking all addresses you control
- **Who you transact with** - By linking your addresses to merchants or individuals
- **Your spending habits** - By analyzing transaction amounts and patterns
- **Your location or identity** - By correlating blockchain data with other information

### Real-World Privacy Risks

- **Financial Surveillance**: Companies and governments can track your financial activity
- **Targeted Attacks**: Criminals may target you if they know you hold significant Bitcoin
- **Discrimination**: Merchants or services might treat you differently based on your transaction history
- **Loss of Fungibility**: Some Bitcoin may be treated as "tainted" based on its history

**This wallet includes powerful privacy features to help protect you from these risks.**

---

## Privacy Features in This Wallet

### 1. **Automatic Fresh Addresses** ✅

**What it does**: Every time you receive Bitcoin, the wallet automatically generates a new, unused address for you.

**Why it matters**: Using a new address for each transaction makes it much harder for others to:
- Calculate your total Bitcoin balance
- Link your transactions together
- Track your receiving history

**How to use it**: Nothing! This feature works automatically. When you open the "Receive" screen, you'll see a fresh address ready to use.

---

### 2. **Change Address Privacy** ✅

**What it does**: When you send Bitcoin, the wallet automatically creates a unique "change address" for any leftover funds.

**Why it matters**: Without this feature, sending Bitcoin would reveal:
- Which address is yours (the change)
- Which address belongs to the recipient
- Your total available balance

**Example**:
- You have 1.0 BTC and want to send 0.3 BTC
- The wallet sends 0.3 BTC to the recipient
- The remaining 0.7 BTC goes to a fresh change address you control
- **Privacy violation prevented**: No one can tell which address is the change

**How to use it**: Nothing! This feature works automatically. Every transaction uses a unique change address.

---

### 3. **Random UTXO Selection** ✅

**What it does**: When building a transaction, the wallet randomly selects which Bitcoin "coins" (UTXOs) to use.

**Why it matters**: Many wallets always use the same selection strategy (like "largest coins first"). This creates a **fingerprint** that allows blockchain analysts to identify transactions from your wallet, even if you use different addresses.

**Example**:
- **Without randomization**: An analyst can say "This transaction used the largest-first strategy, so it's probably from Wallet X"
- **With randomization**: Each transaction looks different, making it impossible to link them by selection pattern

**How to use it**: Nothing! This feature works automatically when you send Bitcoin.

---

### 4. **Contact Address Rotation (Xpub)** ✅

**What it does**: Instead of saving a single address for your contacts, you can save their **Extended Public Key (xpub)**. This lets the wallet automatically generate a fresh address each time you send to them.

**Why it matters**: Reusing the same address for repeat payments creates a permanent link between all those transactions. Anyone can see:
- How many times you've sent to that person/merchant
- The total amount you've sent
- Patterns in your payment schedule

**How to use it**:

1. **When adding a contact**, ask them for their **xpub** (extended public key) instead of a single address
2. **When sending**, select the contact from your contacts list
3. The wallet automatically uses a fresh address from their xpub
4. You'll see a ✅ **green "Address Rotation"** badge confirming privacy protection

**Privacy indicators**:
- ✅ Green badge = Contact uses xpub (excellent privacy)
- ⚠️ Amber badge = Contact uses single address (privacy risk)

---

### 5. **Address Reuse Warnings** ⚠️

**What it does**: The wallet tracks how many times you've sent to a single-address contact and displays warnings when privacy is at risk.

**Why it matters**: Every time you reuse an address, you:
- Link all those transactions together
- Make it easier to calculate total amounts
- Reduce your privacy and the recipient's privacy

**What you'll see**:
- **First send**: No warning
- **Second send**: ⚠️ "Sent 1 time to this address (privacy risk)"
- **Third send**: ⚠️ "Sent 2 times to this address (privacy risk)"
- **Ongoing**: Counter increases with each reuse

**How to respond**:
1. **Best option**: Ask the contact for their xpub to enable address rotation
2. **Acceptable**: Continue using the single address if they can't provide xpub
3. **Tip**: The wallet provides a suggestion: "💡 Tip: Ask [Contact Name] for an xpub to enable address rotation for better privacy"

---

### 6. **Privacy Status Badges**

The wallet uses color-coded badges throughout the interface to help you make privacy-conscious decisions:

| Badge | Meaning | Location |
|-------|---------|----------|
| ✅ **Fresh** | Unused address (good privacy) | Receive screen, address list |
| ⚠️ **Previously used** | Address has received funds before | Receive screen, address list |
| ✅ **Address Rotation** | Contact uses xpub (excellent privacy) | Send screen, Contacts, Transaction history |
| ⚠️ **Reuses Address** | Contact uses single address (privacy risk) | Send screen, Contacts, Transaction history |

**Using these badges**:
- **Green (✅)**: Good privacy - no action needed
- **Amber (⚠️)**: Privacy risk - consider improving (e.g., request xpub from contact)

---

## Understanding Privacy Indicators

### Receive Screen

When you open the Receive screen, you'll see:

```
┌─────────────────────────────────────────┐
│ ✅ Fresh Address Generated               │
│                                           │
│ New address generated for privacy.        │
│ Using fresh addresses helps protect       │
│ your transaction history.                 │
└─────────────────────────────────────────┘

[QR Code]

tb1qnew1fresh2address3example4...

[✅ Copy Address]
```

**What this means**: The wallet has automatically created a new address for you. This address has never been used before, providing maximum privacy.

---

### Send Screen - Xpub Contact (Good Privacy)

When sending to a contact with xpub:

```
To Address: [Select from Contacts ▼]

Selected: Alice Johnson
tb1qfresh5auto6generated7...

┌─────────────────────────────────────────┐
│ ✅ Address Rotation Enabled              │
│                                           │
│ Using fresh address for Alice Johnson.   │
│ Address rotation helps protect your       │
│ transaction privacy.                      │
└─────────────────────────────────────────┘
```

**What this means**: The wallet automatically selected the next unused address from Alice's xpub. This provides excellent privacy for both you and Alice.

---

### Send Screen - Single Address Contact (Privacy Risk)

When sending to a contact with a single address:

```
To Address: [Select from Contacts ▼]

Selected: Bob's Hardware Store
bc1qsame7address8always9...

┌─────────────────────────────────────────┐
│ ⚠️ Privacy Notice                        │
│                                           │
│ This contact uses a single address.       │
│ Reusing the same address for multiple     │
│ transactions reduces your privacy.         │
│                                           │
│ You've sent to this address 3 times       │
│ before.                                   │
│                                           │
│ 💡 Tip: Ask Bob's Hardware Store for an   │
│ xpub to enable address rotation for        │
│ better privacy.                           │
└─────────────────────────────────────────┘
```

**What this means**: You're about to reuse an address you've sent to 3 times before. This creates a privacy risk. Consider asking Bob's Hardware Store for their xpub.

---

### Transaction History

In your transaction history, you'll see privacy badges next to contact names:

```
Transactions
─────────────────────────────────────────

↓ Received from
  Alice Johnson ✅ Address Rotation  [Exchange]
  +0.05000000 BTC
  2 days ago • 6 confirmations

↑ Sent to
  Bob's Hardware Store ⚠️ Reuses Address
  -0.00500000 BTC
  1 week ago • 144 confirmations
```

**What this means**:
- Alice uses xpub (green badge) - excellent privacy
- Bob uses a single address (amber badge) - privacy risk

---

## Best Practices for Maximum Privacy

### 1. Always Use Fresh Addresses

✅ **Do this**:
- Use the Receive screen to generate a new address for each payment
- Never manually give out the same address twice

❌ **Avoid this**:
- Posting the same address on a website or social media
- Using the same address for multiple payments from different sources

---

### 2. Request Xpubs from Regular Contacts

✅ **Do this**:
- For people/businesses you pay regularly, ask for their xpub
- Save the xpub in your contacts list
- Let the wallet automatically rotate addresses

❌ **Avoid this**:
- Saving a single address for repeat payments
- Ignoring the ⚠️ address reuse warnings

**How to ask for an xpub**:
> "Hi [Name], I use a Bitcoin wallet that supports address rotation for better privacy. Could you please provide your extended public key (xpub/zpub) instead of a single address? This will let me generate fresh addresses for each payment, which is better for both our privacy."

---

### 3. Understand Your Privacy Trade-offs

Some situations require trade-offs between privacy and convenience:

| Situation | Privacy Best Practice | Trade-off |
|-----------|----------------------|-----------|
| **Merchant without xpub support** | Accept single address, acknowledge privacy risk | Convenience over privacy |
| **Donation address** | Merchant's choice; you can still use fresh change addresses | Public donation vs. privacy |
| **Quick one-time payment** | Fresh address always, even for single payment | None - best practice |
| **Regular subscription** | Request xpub for automatic rotation | Requires merchant support |

---

### 4. Be Cautious with Public Address Exposure

❌ **Never do this**:
- Post your Bitcoin address publicly on social media
- Include a Bitcoin address in an email signature
- Use the same address for donations over a long period

✅ **Instead, do this**:
- Post an xpub (zpub) for donations with rotation
- Use a fresh address for each public posting
- Rotate donation addresses quarterly or when significant amounts are received

---

### 5. Monitor Your Privacy Indicators

Pay attention to the wallet's privacy badges and warnings:

- ✅ **Green badges**: Good job! Keep using these privacy-protecting patterns
- ⚠️ **Amber badges**: Privacy risk detected - can you improve this?
- **Reusage counters**: High counts mean high privacy risk - consider requesting xpub

---

## How Bitcoin Privacy Works

### The UTXO Model

Bitcoin uses a **UTXO (Unspent Transaction Output)** model, similar to cash:

**Example**:
1. You receive 1.0 BTC → This creates a UTXO worth 1.0 BTC
2. You send 0.3 BTC → This **spends** the 1.0 BTC UTXO and creates:
   - A 0.3 BTC UTXO for the recipient
   - A 0.7 BTC UTXO back to you (change)

### Privacy Implications

- **Each transaction links UTXOs together** → Creates a transaction graph
- **Reusing addresses links more UTXOs** → Easier to calculate your total balance
- **Fresh addresses keep UTXOs separate** → Harder to link transactions

### This Wallet's Privacy Strategy

1. **Fresh receiving addresses** → Separates incoming UTXOs
2. **Fresh change addresses** → Hides which output is yours
3. **Random UTXO selection** → Prevents wallet fingerprinting
4. **Xpub rotation for contacts** → Prevents linking repeat payments

---

## Common Privacy Mistakes

### Mistake #1: Consolidating UTXOs Unnecessarily

**What it is**: Combining many small UTXOs into one large UTXO

**Why it's bad**: This links all those addresses together, revealing your total holdings

**When it's okay**:
- Preparing for a large payment
- Reducing future transaction fees
- Consolidating during low-fee periods

**Privacy tip**: Only consolidate when necessary, and use a fresh address for the consolidated output

---

### Mistake #2: Ignoring Change Address Privacy

**What it is**: Not understanding which output is the change in a transaction

**Why it's bad**: If an analyst can identify the change, they can track your remaining balance

**How this wallet helps**: Automatically creates unique change addresses, making change identification difficult

---

### Mistake #3: Reusing Addresses for Donations

**What it is**: Posting the same donation address for months or years

**Why it's bad**: Anyone can see:
- All donations you've received
- Total amount donated to you
- Timing and patterns of donations

**Better approach**: Use an xpub for donations, or rotate addresses monthly

---

### Mistake #4: Mixing Privacy Levels

**What it is**: Sending from a "privacy-protected" UTXO together with a "public" UTXO

**Why it's bad**: Links the privacy-protected UTXO to your known identity

**How to avoid**: Keep UTXOs separate by source:
- UTXOs from KYC exchanges → Separate addresses
- UTXOs from private sources → Separate addresses
- Only combine when necessary

---

## Advanced Privacy Tips

### 1. Understanding Address Types and Privacy

This wallet supports three address types, each with different privacy implications:

| Address Type | Starts With | Privacy Level | Notes |
|--------------|-------------|---------------|-------|
| **Native SegWit (Bech32)** | `tb1` (testnet), `bc1` (mainnet) | ⭐⭐⭐ Best | Lowest fees, best privacy, modern standard |
| **SegWit (P2SH)** | `2` (testnet), `3` (mainnet) | ⭐⭐ Good | Compatible with older wallets |
| **Legacy (P2PKH)** | `m/n` (testnet), `1` (mainnet) | ⭐ Acceptable | Highest fees, oldest standard |

**Privacy recommendation**: Use Native SegWit (tb1/bc1) for best privacy and lowest fees.

---

### 2. Gap Limit and Address Scanning

The wallet generates addresses in sequence and scans for used addresses up to a "gap limit" (default: 20).

**Privacy consideration**:
- Generating many addresses improves privacy
- But too many sequential unused addresses can slow wallet scanning
- The wallet's default settings balance privacy and performance

---

### 3. Coin Control (Future Feature)

**What it is**: Manually selecting which UTXOs to spend in a transaction

**Privacy benefit**: Allows you to keep UTXOs separate by source or privacy level

**Status**: Not yet implemented, but planned for future releases

---

### 4. Privacy and Network Analysis

**What blockchain analysts can see**:
- Transaction amounts
- Transaction timing
- Address links (when UTXOs are combined)
- Address types

**What they can't see** (with this wallet):
- Your identity (unless you reveal it)
- Your total balance (if you use fresh addresses)
- Which UTXO is change (thanks to fresh change addresses)
- Your wallet software (thanks to random UTXO selection)

---

## FAQ

### Q: Does this wallet provide "anonymous" Bitcoin transactions?

**A**: No. Bitcoin is **pseudonymous**, not anonymous. Your transactions are public, but your real identity isn't directly linked to your addresses. This wallet provides strong privacy features to make linking transactions to your identity much more difficult, but determined adversaries (governments, blockchain analysis companies) with significant resources may still be able to correlate your activity.

---

### Q: Can I reuse an address if I really need to?

**A**: Yes, but you'll receive a warning. Reusing addresses significantly reduces your privacy, but sometimes it's unavoidable (e.g., a merchant only provides a single address). The wallet will always warn you about the privacy implications.

---

### Q: What's the difference between an address and an xpub?

**A**:
- **Address** (e.g., `tb1qexample...`): A single destination for Bitcoin. Can be used once or reused.
- **Xpub** (Extended Public Key): A master key that can generate thousands of addresses. Allows automatic address rotation.

Think of an xpub like a "master address generator" that creates fresh addresses on demand.

---

### Q: How do I get an xpub to share with others?

**A**:
1. Go to **Settings** > **Account Settings**
2. Click "**Export Extended Public Key (xpub)**"
3. Copy the xpub and share it with the person who will pay you
4. They add your xpub to their contacts, and their wallet generates fresh addresses for each payment

---

### Q: Are xpubs safe to share publicly?

**A**: **Partially**. Sharing an xpub reveals:
- ✅ **Safe**: Allows others to generate payment addresses for you (good for donations)
- ⚠️ **Risk**: Reveals all addresses derived from that xpub and their transaction history

**Best practice**:
- Share xpubs with **trusted** contacts for repeat payments
- For public donations, use a dedicated xpub separate from your main account
- Never share your **private keys** or **seed phrase** (those control your funds!)

---

### Q: Why is randomized UTXO selection important?

**A**: Many wallets use predictable UTXO selection (e.g., largest-first, oldest-first). Blockchain analysts can identify these patterns and link transactions from the same wallet. Randomized selection removes this "fingerprint," making your transactions look like they could come from any wallet.

---

### Q: Can I disable privacy features if I want?

**A**: Some features (fresh addresses, change address privacy, random UTXO selection) are built into the wallet and cannot be disabled - they're essential for basic privacy. Address reuse warnings can be dismissed, but the warnings will continue to appear.

---

### Q: Does this wallet use CoinJoin or other mixing techniques?

**A**: No, not currently. This wallet focuses on **basic privacy hygiene** through:
- Fresh address generation
- Change address privacy
- Random UTXO selection
- Contact address rotation

**CoinJoin** (combining transactions with other users) may be added in future versions, but these current features already provide significant privacy improvements over many wallets.

---

### Q: Will privacy features increase my transaction fees?

**A**: No. Privacy features like fresh addresses and randomized UTXO selection do not increase fees. Transaction fees depend on:
- Transaction size (number of inputs and outputs)
- Current network fee rates (sat/vB)
- Your selected fee speed (slow/medium/fast)

---

### Q: What if I accidentally sent to the wrong address?

**A**: Bitcoin transactions are **irreversible**. Always double-check the recipient address before sending. Privacy features don't affect this - they only make it harder for others to track your transactions.

---

### Q: How can I check my privacy score?

**A**: The wallet doesn't currently provide a "privacy score," but you can evaluate your privacy by checking:

✅ **Good privacy indicators**:
- All contacts use xpub (✅ green badges)
- Low reusage counts (0-1)
- Fresh addresses for every receive
- No addresses posted publicly

⚠️ **Privacy risk indicators**:
- Many contacts with ⚠️ amber badges
- High reusage counts (5+)
- Same address used for multiple purposes
- Posted addresses on social media

---

## Summary: Privacy Checklist

Use this checklist to evaluate your Bitcoin privacy practices:

### Basic Privacy (Essential)

- ✅ I use a fresh address for each payment I receive
- ✅ I let the wallet automatically generate change addresses
- ✅ I never share my seed phrase or private keys
- ✅ I understand that Bitcoin transactions are public
- ✅ I pay attention to privacy warnings in the wallet

### Intermediate Privacy (Recommended)

- ✅ I request xpubs from people/businesses I pay regularly
- ✅ I use the Contacts feature with xpub rotation
- ✅ I avoid posting Bitcoin addresses publicly
- ✅ I understand the trade-offs between privacy and convenience
- ✅ I rotate donation addresses quarterly

### Advanced Privacy (Optional)

- ✅ I keep UTXOs from different sources separate
- ✅ I only consolidate UTXOs when necessary
- ✅ I use Native SegWit (bc1/tb1) addresses for best privacy
- ✅ I educate contacts about xpub benefits
- ✅ I regularly review my transaction history for privacy patterns

---

## Additional Resources

- [Bitcoin Privacy Guide](https://bitcoin.org/en/protect-your-privacy) - Official Bitcoin.org privacy guide
- [BIP32: HD Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) - Technical specification for HD wallets
- [BIP44: Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) - Derivation paths for wallet accounts
- [Blockstream Explorer (Testnet)](https://blockstream.info/testnet) - View testnet transactions

---

## Need Help?

If you have questions about privacy features or encounter issues:

1. **Check this guide** for common questions
2. **Review the README.md** for technical details
3. **Report issues** at: https://github.com/anthropics/bitcoin-wallet/issues (when available)

**Remember**: This wallet provides strong privacy features, but your privacy ultimately depends on how you use Bitcoin. Always think about the privacy implications of your transactions.

---

**Last Updated**: October 2025
**Wallet Version**: 0.10.0 (Privacy Enhancement Update)

---

*This guide is intended for educational purposes. Always do your own research and understand the risks before using Bitcoin.*
