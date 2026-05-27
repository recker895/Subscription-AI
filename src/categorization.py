import pandas as pd
import re

# Domain regex patterns for high-tier fallback matching
SEMANTIC_CATEGORIES = {
    "Cloud Infrastructure & SaaS": r".*(aws|amazon web|gcp|google cloud|azure|digitalocean|vercel|supabase|cloudflare).*",
    "Productivity & Dev Tools": r".*(github|gitlab|openai|anthropic|copilot|figma|slack|zoom|notion|atlassian|jira).*",
    "Streaming & Entertainment": r".*(netflix|spotify|disney|hulu|hbo|prime video|youtube|audible|twitch).*",
    "Telecom & Utilities": r".*(comcast|verizon|att|tmobile|vodafone|electricity|water|gas|isp).*",
    "Financial Services": r".*(quickbooks|xero|stripe|paypal|gusto|adp|experian|bloomberg).*"
}

def classify_core_subscriptions(subs_df: pd.DataFrame) -> pd.DataFrame:
    """
    Classifies isolated subscription items into semantic fields using combined
    Merchant Category Codes (MCC) and rule-based string distance maps.
    """
    df = subs_df.copy()
    categories = []

    for _, row in df.iterrows():
        merchant_clean = str(row['merchant_name']).lower().strip()
        matched_category = None

        # Tier 1: Pattern Matching Regex Inspection Loop
        for category_label, pattern in SEMANTIC_CATEGORIES.items():
            if re.match(pattern, merchant_clean):
                matched_category = category_label
                break
        
        # Tier 2: MCC-Based Fallback Matching Architecture
        if not matched_category and 'mcc' in df.columns:
            mcc_code = str(row['mcc']).strip()
            # Mapping common digital billing operational MCC codes
            if mcc_code in ['4816', '7372']:
                matched_category = "Cloud Infrastructure & SaaS"
            elif mcc_code in ['4841', '7841']:
                matched_category = "Streaming & Entertainment"
            elif mcc_code in ['4814', '4900']:
                matched_category = "Telecom & Utilities"
            elif mcc_code in ['6012', '6300']:
                matched_category = "Financial Services"

        # Default fallback assignment if matching rules pass without resolution
        if not matched_category:
            matched_category = "Lifestyle & Enterprise Subscriptions"

        categories.append(matched_category)

    df['category'] = categories
    
    # Filter out known volatile non-subscription category footprints
    blacklist_categories = ["Tolls and Bridge Fees", "Fast Food Restaurants", "Laundry Services"]
    df = df[~df['category'].isin(blacklist_categories)]
    
    return df