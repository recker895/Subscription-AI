import os
import pandas as pd

from src.recurring_detection import (
    execute_advanced_detection
)

from src.categorization import (
    classify_core_subscriptions
)

from src.recommendations import (
    generate_optimized_ai_narrative
)

# =========================================================
# MAIN PIPELINE
# =========================================================

def run_pipeline(file_path: str):

    # =====================================================
    # LOAD CSV
    # =====================================================

    if not os.path.exists(file_path):

        return {
            "error":
                "CSV file not found"
        }

    try:

        raw_df = pd.read_csv(file_path)

    except Exception as e:

        return {
            "error":
                f"CSV load failed: {str(e)}"
        }

    # =====================================================
    # EMPTY CHECK
    # =====================================================

    if len(raw_df) == 0:

        return {
            "error":
                "CSV file is empty"
        }

    # =====================================================
    # COLUMN NORMALIZATION
    # =====================================================

    rename_map = {

        'merchant':
            'description',

        'merchant_name':
            'description',

        'Merchant':
            'description',

        'Description':
            'description',

        'Date':
            'date',

        'Transaction Date':
            'date',
    }

    raw_df = raw_df.rename(

        columns={

            k: v

            for k, v

            in rename_map.items()

            if k in raw_df.columns
        }
    )

    # =====================================================
    # REQUIRED COLUMNS
    # =====================================================

    if "description" not in raw_df.columns:

        return {
            "error":
                "Missing description column"
        }

    if "amount" not in raw_df.columns:

        return {
            "error":
                "Missing amount column"
        }

    if "date" not in raw_df.columns:

        return {
            "error":
                "Missing date column"
        }

    # =====================================================
    # CLEAN DATA
    # =====================================================

    raw_df["date"] = pd.to_datetime(

        raw_df["date"],

        errors="coerce"
    )

    raw_df["amount"] = (

        raw_df["amount"]

        .astype(str)

        .str.replace(
            r'[\$,]',
            '',
            regex=True
        )
    )

    raw_df["amount"] = pd.to_numeric(

        raw_df["amount"],

        errors="coerce"
    )

    raw_df = raw_df.dropna(
        subset=[
            "amount",
            "date"
        ]
    )

    # =====================================================
    # DETECTION ENGINE
    # =====================================================

    detected_subs_df = (

        execute_advanced_detection(
            raw_df
        )
    )

    # =====================================================
    # NO SUBSCRIPTIONS
    # =====================================================

    if detected_subs_df.empty:

        return {

            "total_transactions":
                int(len(raw_df)),

            "unique_merchants":
                0,

            "total_spending":
                0,

            "subscriptions_detected":
                0,

            "estimated_savings":
                0,

            "category_distribution":
                {},

            "insights":
                [
                    "No recurring subscriptions detected."
                ],

            "actionable_steps":
                [],

            "active_subscriptions":
                []
        }

    # =====================================================
    # CATEGORIZATION
    # =====================================================

    enriched_df = (

        classify_core_subscriptions(
            detected_subs_df
        )
    )

    # =====================================================
    # METRICS
    # =====================================================

    total_transactions = int(
        len(raw_df)
    )

    unique_merchants = int(

        enriched_df["merchant_name"]
        .nunique()
    )

    subscriptions_detected = int(
        len(enriched_df)
    )

    total_monthly_spend = float(

        enriched_df["monthly_price"]
        .sum()
    )

    estimated_savings = float(

        round(
            total_monthly_spend * 0.15,
            2
        )
    )

    # =====================================================
    # CATEGORY DISTRIBUTION
    # =====================================================

    category_chart_data = (

        enriched_df

        .groupby("category")[
            "monthly_price"
        ]

        .sum()

        .round(2)

        .to_dict()
    )

    # =====================================================
    # AI RECOMMENDATIONS
    # =====================================================

    ai_response = (

        generate_optimized_ai_narrative(

            enriched_df,

            total_monthly_spend
        )
    )

    # =====================================================
    # DEBUG
    # =====================================================

    print("\n========== FINAL PIPELINE ==========")

    print(
        "Transactions:",
        total_transactions
    )

    print(
        "Subscriptions:",
        subscriptions_detected
    )

    print(
        "Merchants:",
        unique_merchants
    )

    print(
        "Categories:",
        category_chart_data
    )

    print(
        "Timeline Records:",
        len(enriched_df)
    )

    print("====================================\n")

    # =====================================================
    # RETURN
    # =====================================================

    return {

        "total_transactions":
            total_transactions,

        "unique_merchants":
            unique_merchants,

        "total_spending":
            round(
                total_monthly_spend,
                2
            ),

        "subscriptions_detected":
            subscriptions_detected,

        "estimated_savings":
            estimated_savings,

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

        # THIS FIXES YOUR CHARTS

        "active_subscriptions":

            enriched_df.to_dict(
                orient="records"
            )
    }