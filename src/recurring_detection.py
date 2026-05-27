import pandas as pd
import numpy as np
import re
from datetime import datetime

# =========================================================
# MERCHANT NORMALIZATION
# =========================================================

def normalize_merchant_name(text: str) -> str:

    if pd.isna(text):
        return "Unknown Merchant"

    name = str(text).lower().strip()

    noise_patterns = [

        r'\bx[x\s\d\-]+\b',

        r'\b(inc|llc|corp|co|ltd|gmbh)\b',

        r'\*[\w\s\-\.\/]+',

        r'\d{2,}',

        r'\s(san francisco|new york|pune|london|ca|ny)\b',

        r'[^a-z0-9\s\&\+]',
    ]

    for pattern in noise_patterns:

        name = re.sub(
            pattern,
            ' ',
            name
        )

    name = re.sub(
        r'\s+',
        ' ',
        name
    ).strip()

    return name.title()

# =========================================================
# BILLING FREQUENCY DETECTOR
# =========================================================

def detect_billing_frequency(
    avg_interval: float,
    interval_std: float
) -> str:

    if 20 <= avg_interval <= 40:
        return "Monthly"

    elif 10 <= avg_interval <= 18:
        return "Bi-Weekly"

    elif 5 <= avg_interval <= 10:
        return "Weekly"

    elif 80 <= avg_interval <= 100:
        return "Quarterly"

    elif 330 <= avg_interval <= 390:
        return "Annual"

    return "Irregular"

# =========================================================
# MAIN DETECTOR
# =========================================================

def execute_advanced_detection(
    df: pd.DataFrame
) -> pd.DataFrame:

    # =====================================================
    # COPY
    # =====================================================

    df = df.copy()

    # =====================================================
    # DATE
    # =====================================================

    df['date'] = pd.to_datetime(
        df['date'],
        errors='coerce'
    )

    # =====================================================
    # DESCRIPTION COLUMN
    # =====================================================

    desc_col = None

    if 'description' in df.columns:
        desc_col = 'description'

    elif 'merchant' in df.columns:
        desc_col = 'merchant'

    elif 'merchant_name' in df.columns:
        desc_col = 'merchant_name'

    if not desc_col:

        raise KeyError(
            "Missing description column"
        )

    # =====================================================
    # USER COLUMN
    # =====================================================

    user_col = None

    if "user_id" in df.columns:
        user_col = "user_id"

    elif "client_id" in df.columns:
        user_col = "client_id"

    else:

        # fallback fake user

        df["user_id"] = 1

        user_col = "user_id"

    # =====================================================
    # CLEAN MERCHANTS
    # =====================================================

    df["merchant_name"] = (

        df[desc_col]

        .astype(str)

        .apply(
            normalize_merchant_name
        )
    )

    # =====================================================
    # CLEAN AMOUNTS
    # =====================================================

    df["amount"] = pd.to_numeric(

        df["amount"],

        errors="coerce"
    )

    df = df.dropna(
        subset=[
            "amount",
            "date"
        ]
    )

    # =====================================================
    # SORT
    # =====================================================

    df = df.sort_values(
        by=[
            user_col,
            "merchant_name",
            "date"
        ]
    )

    # =====================================================
    # GROUP
    # =====================================================

    grouped = df.groupby([
        user_col,
        "merchant_name"
    ])

    detected_subscriptions = []

    # =====================================================
    # LOOP
    # =====================================================

    for (
        user_id,
        merchant
    ), group in grouped:

        transaction_count = len(group)

        # ================================================
        # RELAXED FILTER
        # ================================================

        if transaction_count < 2:
            continue

        group = group.sort_values(
            "date"
        )

        dates = group["date"]

        amounts = group["amount"]

        # ================================================
        # DATE DIFFERENCES
        # ================================================

        date_diffs = (

            dates.diff()

            .dropna()

            .dt.days
        )

        if len(date_diffs) == 0:
            continue

        avg_interval = (
            date_diffs.mean()
        )

        interval_std = (
            date_diffs.std()
            if len(date_diffs) > 1
            else 0
        )

        avg_amount = (
            amounts.mean()
        )

        amount_std = (

            amounts.std()

            if len(amounts) > 1

            else 0
        )

        # ================================================
        # FREQUENCY
        # ================================================

        frequency_tier = (

            detect_billing_frequency(
                avg_interval,
                interval_std
            )
        )

        # ================================================
        # RELAXED RULES
        # ================================================

        valid_frequency = (
            frequency_tier != "Irregular"
        )

        # MUCH MORE RELAXED

        is_amount_stable = (

            amount_std / avg_amount <= 0.60

            if avg_amount > 0

            else False
        )

        # MUCH MORE RELAXED

        is_lifecycle_valid = True

        # ================================================
        # ACTIVE STATUS
        # ================================================

        last_tx = dates.max()

        days_since_last_charge = (

            datetime.now() - last_tx

        ).days

        is_active_status = (
            days_since_last_charge <= 120
        )

        # ================================================
        # PRICE ESCALATION
        # ================================================

        latest_amount = amounts.iloc[-1]

        has_price_escalated = False

        escalation_percentage = 0

        if len(amounts) >= 3:

            historical_avg_prev = (

                amounts.iloc[:-1].mean()
            )

            if historical_avg_prev > 0:

                escalation_percentage = (

                    (
                        latest_amount
                        - historical_avg_prev
                    )

                    / historical_avg_prev

                ) * 100

                if escalation_percentage >= 10:

                    has_price_escalated = True

        # ================================================
        # FINAL DETECTION
        # ================================================

        if (

            valid_frequency

            and is_amount_stable

            and is_lifecycle_valid
        ):

            # ============================================
            # ANNUAL DRAIN
            # ============================================

            if frequency_tier == "Monthly":

                annual_projection = (
                    avg_amount * 12
                )

            elif frequency_tier == "Weekly":

                annual_projection = (
                    avg_amount * 52
                )

            elif frequency_tier == "Bi-Weekly":

                annual_projection = (
                    avg_amount * 26
                )

            elif frequency_tier == "Quarterly":

                annual_projection = (
                    avg_amount * 4
                )

            else:

                annual_projection = (
                    avg_amount
                )

            detected_subscriptions.append({

                "client_id":
                    user_id,

                "merchant_name":
                    merchant,

                "billing_frequency":
                    frequency_tier,

                "average_amount":
                    round(
                        float(avg_amount),
                        2
                    ),

                "monthly_price":
                    round(
                        float(avg_amount),
                        2
                    ),

                "latest_billing_amount":
                    round(
                        float(latest_amount),
                        2
                    ),

                "transaction_count":
                    int(transaction_count),

                "first_billing_date":
                    dates.min().strftime(
                        '%Y-%m-%d'
                    ),

                "last_billing_date":
                    dates.max().strftime(
                        '%Y-%m-%d'
                    ),

                "is_active":
                    bool(is_active_status),

                "price_anomaly_detected":
                    bool(has_price_escalated),

                "annual_projected_drain":
                    round(
                        float(
                            annual_projection
                        ),
                        2
                    )
            })

    # =====================================================
    # RETURN
    # =====================================================

    return pd.DataFrame(
        detected_subscriptions
    )