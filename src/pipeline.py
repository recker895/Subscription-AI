import os
import pandas as pd
import numpy as np

# =============================================================================
# INTERNAL MODULE IMPORTS
# =============================================================================

from src.recurring_detection import execute_advanced_detection
from src.categorization import classify_core_subscriptions
from src.recommendations import generate_optimized_ai_narrative

# =============================================================================
# MASTER PIPELINE
# =============================================================================

def run_pipeline(file_path: str) -> dict:
    """
    Master Subscription Intelligence Pipeline.
    """

    print(f"\n[PIPELINE CORE] Processing file: {file_path}")

    # =========================================================================
    # FILE VALIDATION
    # =========================================================================

    if not os.path.exists(file_path):

        return {
            "error":
            f"Dataset file not found at path: {file_path}"
        }

    # =========================================================================
    # READ DATASET
    # =========================================================================

    try:

        raw_df = pd.read_csv(file_path)

    except Exception as e:

        return {
            "error":
            f"CSV parsing failed: {str(e)}"
        }

    # =========================================================================
    # EMPTY DATASET CHECK
    # =========================================================================

    total_transactions = len(raw_df)

    if total_transactions == 0:

        return {
            "error":
            "Uploaded dataset contains zero rows."
        }

    # =========================================================================
    # STANDARDIZE COLUMN NAMES
    # =========================================================================

    raw_df.columns = [

        col.strip().lower()

        for col in raw_df.columns
    ]

    print("\n[PIPELINE] DETECTED COLUMNS:")
    print(raw_df.columns.tolist())

    # =========================================================================
    # DATE COLUMN DETECTION
    # =========================================================================

    date_candidates = [

        "date",
        "transaction_date",
        "transaction date",
        "timestamp",
        "time",
        "created_at",
        "payment_date"
    ]

    found_date = None

    for col in date_candidates:

        if col in raw_df.columns:

            found_date = col
            break

    if found_date:

        raw_df = raw_df.rename(
            columns={
                found_date: "date"
            }
        )

    else:

        return {
            "error":
            f"No valid date column found. "
            f"Detected columns: {raw_df.columns.tolist()}"
        }

    # =========================================================================
    # MERCHANT COLUMN DETECTION
    # =========================================================================

    merchant_candidates = [

        "merchant",
        "merchant_name",
        "description",
        "service_name",
        "vendor",
        "service"
    ]

    found_merchant = None

    for col in merchant_candidates:

        if col in raw_df.columns:

            found_merchant = col
            break

    if found_merchant:

        raw_df = raw_df.rename(
            columns={
                found_merchant: "description"
            }
        )

    else:

        return {
            "error":
            f"No merchant column found. "
            f"Detected columns: {raw_df.columns.tolist()}"
        }

    # =========================================================================
    # USER COLUMN DETECTION
    # =========================================================================

    user_candidates = [

        "user_id",
        "client_id",
        "customer_id",
        "account_id"
    ]

    found_user = None

    for col in user_candidates:

        if col in raw_df.columns:

            found_user = col
            break

    if found_user:

        raw_df = raw_df.rename(
            columns={
                found_user: "user_id"
            }
        )

    else:

        # fallback if dataset has no users
        raw_df["user_id"] = 1

    # =========================================================================
    # AMOUNT COLUMN DETECTION
    # =========================================================================

    amount_candidates = [

        "amount",
        "price",
        "cost",
        "payment",
        "billing_amount"
    ]

    found_amount = None

    for col in amount_candidates:

        if col in raw_df.columns:

            found_amount = col
            break

    if found_amount:

        raw_df = raw_df.rename(
            columns={
                found_amount: "amount"
            }
        )

    else:

        return {
            "error":
            f"No amount column found. "
            f"Detected columns: {raw_df.columns.tolist()}"
        }

    # =========================================================================
    # DATA TYPE CLEANING
    # =========================================================================

    try:

        raw_df["date"] = pd.to_datetime(
            raw_df["date"],
            errors="coerce"
        )

    except Exception as e:

        return {
            "error":
            f"Date conversion failure: {str(e)}"
        }

    try:

        raw_df["amount"] = (
            raw_df["amount"]
            .astype(str)
            .str.replace(r"[\$,]", "", regex=True)
        )

        raw_df["amount"] = pd.to_numeric(
            raw_df["amount"],
            errors="coerce"
        )

    except Exception as e:

        return {
            "error":
            f"Amount conversion failure: {str(e)}"
        }

    # =========================================================================
    # REMOVE INVALID ROWS
    # =========================================================================

    raw_df = raw_df.dropna(
        subset=[
            "date",
            "amount"
        ]
    )

    raw_df = raw_df[
        raw_df["amount"] > 0
    ]

    # =========================================================================
    # POST-CLEANING CHECK
    # =========================================================================

    if raw_df.empty:

        return {
            "error":
            "All rows became invalid after cleaning."
        }

    # =========================================================================
    # EXECUTE ADVANCED RECURRING DETECTION
    # =========================================================================

    print("\n[PIPELINE] Running recurring detection engine...")

    try:

        detected_subs_df = execute_advanced_detection(raw_df)

    except Exception as e:

        return {
            "error":
            f"Recurring detection engine failure: {str(e)}"
        }

    # =========================================================================
    # NO SUBSCRIPTIONS DETECTED
    # =========================================================================

    if detected_subs_df.empty:

        return {

            "total_transactions":
            int(total_transactions),

            "unique_merchants":
            0,

            "total_spending":
            0.0,

            "subscriptions_detected":
            0,

            "estimated_savings":
            0.0,

            "category_distribution":
            {},

            "insights": [
                "No recurring subscription patterns detected."
            ],

            "actionable_steps": [],

            "active_subscriptions": []
        }

    # =========================================================================
    # CATEGORY ENRICHMENT
    # =========================================================================

    print("\n[PIPELINE] Running categorization engine...")

    try:

        enriched_subs_df = classify_core_subscriptions(
            detected_subs_df
        )

    except Exception as e:

        return {
            "error":
            f"Categorization engine failure: {str(e)}"
        }

    # =========================================================================
    # METRIC AGGREGATION
    # =========================================================================

    unique_merchants = int(
        enriched_subs_df["merchant_name"].nunique()
    )

    subscriptions_detected = int(
        len(enriched_subs_df)
    )

    total_monthly_spend = float(

        enriched_subs_df[
            "annual_projected_drain"
        ].sum() / 12.0
    )

    estimated_savings = round(
        total_monthly_spend * 0.22,
        2
    )

    # =========================================================================
    # CATEGORY DISTRIBUTION
    # =========================================================================

    try:

        category_chart_data = (

            enriched_subs_df
            .groupby("category")[
                "annual_projected_drain"
            ]
            .sum()
            .apply(
                lambda x:
                round(float(x / 12.0), 2)
            )
            .to_dict()
        )

    except Exception:

        category_chart_data = {}

    # =========================================================================
    # AI RECOMMENDATIONS
    # =========================================================================

    print("\n[PIPELINE] Running AI recommendation engine...")

    try:

        ai_response = generate_optimized_ai_narrative(
            enriched_subs_df,
            total_monthly_spend
        )

    except Exception as e:

        print(f"\n[AI ENGINE FAILURE] {str(e)}")

        ai_response = {

            "executive_summary": [
                "AI recommendation engine failed safely."
            ],

            "actionable_steps": [
                "Review subscription distribution manually."
            ]
        }

    # =========================================================================
    # FINAL RESPONSE PAYLOAD
    # =========================================================================

    return {

        "total_transactions":
        int(total_transactions),

        "unique_merchants":
        int(unique_merchants),

        "total_spending":
        round(float(total_monthly_spend), 2),

        "subscriptions_detected":
        int(subscriptions_detected),

        "estimated_savings":
        float(estimated_savings),

        "category_distribution":
        category_chart_data,

        "insights":
        ai_response.get(
            "executive_summary",
            []
        ),

        "actionable_steps":
        ai_response.get(
            "actionable_steps",
            []
        ),

        "active_subscriptions":
        enriched_subs_df.to_dict(
            orient="records"
        )
    }