import os
import json
import re
import pandas as pd

from dotenv import load_dotenv

# =============================================================================
# LOAD ENVIRONMENT VARIABLES
# =============================================================================

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_PATH)

# =============================================================================
# OPTIONAL GROQ IMPORT
# =============================================================================

try:
    from groq import Groq

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    if GROQ_API_KEY:
        client = Groq(api_key=GROQ_API_KEY)
        print("[RECOMMENDATIONS] Groq client initialized")
    else:
        client = None
        print("[RECOMMENDATIONS] No API key found")

except Exception as e:

    client = None

    print(
        f"[RECOMMENDATIONS] Groq initialization failed: {str(e)}"
    )

# =============================================================================
# CLEAN JSON RESPONSE
# =============================================================================

def clean_json_response(text: str) -> str:
    """
    Removes markdown wrappers from LLM responses.
    """

    if not text:
        return "{}"

    cleaned = text.strip()

    # Remove ```json
    cleaned = re.sub(
        r"^```json",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    # Remove ```
    cleaned = re.sub(
        r"^```",
        "",
        cleaned
    )

    cleaned = re.sub(
        r"```$",
        "",
        cleaned
    )

    return cleaned.strip()

# =============================================================================
# LOCAL HEURISTIC FALLBACK ENGINE
# =============================================================================

def generate_local_fallback(
    enriched_subs_df: pd.DataFrame,
    total_monthly_spend: float
) -> dict:
    """
    Generates intelligent local recommendations
    without using external LLM APIs.
    """

    executive_summary = []

    actionable_steps = []

    if enriched_subs_df.empty:

        return {
            "executive_summary": [
                "No recurring subscriptions detected."
            ],
            "actionable_steps": [
                "Upload a richer transactional dataset."
            ]
        }

    # -------------------------------------------------------------------------
    # TOP SPEND ANALYSIS
    # -------------------------------------------------------------------------

    top_subs = enriched_subs_df.sort_values(
        by="annual_projected_drain",
        ascending=False
    ).head(5)

    highest_spend = top_subs.iloc[0]

    executive_summary.append(
        f"Highest recurring spend detected from "
        f"{highest_spend['merchant_name']}."
    )

    executive_summary.append(
        f"Estimated monthly recurring commitment is "
        f"${round(total_monthly_spend, 2)}."
    )

    # -------------------------------------------------------------------------
    # CATEGORY ANALYSIS
    # -------------------------------------------------------------------------

    if "category" in enriched_subs_df.columns:

        category_spend = (
            enriched_subs_df.groupby("category")[
                "annual_projected_drain"
            ]
            .sum()
            .sort_values(ascending=False)
        )

        top_category = category_spend.index[0]

        top_category_value = round(
            category_spend.iloc[0] / 12,
            2
        )

        executive_summary.append(
            f"Largest spend concentration occurs in "
            f"{top_category} services."
        )

        actionable_steps.append(
            f"Review {top_category} subscriptions "
            f"to reduce monthly burn rate."
        )

    # -------------------------------------------------------------------------
    # DUPLICATE / HIGH COUNT ANALYSIS
    # -------------------------------------------------------------------------

    duplicate_candidates = enriched_subs_df[
        enriched_subs_df["merchant_name"]
        .duplicated()
    ]

    if len(duplicate_candidates) > 0:

        actionable_steps.append(
            "Potential duplicate recurring vendors detected. "
            "Audit overlapping services."
        )

    # -------------------------------------------------------------------------
    # PRICE ANOMALIES
    # -------------------------------------------------------------------------

    if "price_anomaly_detected" in enriched_subs_df.columns:

        anomalies = enriched_subs_df[
            enriched_subs_df[
                "price_anomaly_detected"
            ] == True
        ]

        if len(anomalies) > 0:

            executive_summary.append(
                f"{len(anomalies)} subscriptions show "
                f"price escalation behavior."
            )

            actionable_steps.append(
                "Review subscriptions with unexpected "
                "billing increases."
            )

    # -------------------------------------------------------------------------
    # SAVINGS ANALYSIS
    # -------------------------------------------------------------------------

    estimated_savings = round(
        total_monthly_spend * 0.22,
        2
    )

    actionable_steps.append(
        f"Potential optimization savings estimated "
        f"at approximately ${estimated_savings} per month."
    )

    return {
        "executive_summary": executive_summary,
        "actionable_steps": actionable_steps
    }

# =============================================================================
# MAIN AI GENERATION FUNCTION
# =============================================================================

def generate_optimized_ai_narrative(
    enriched_subs_df: pd.DataFrame,
    total_monthly_spend: float
) -> dict:
    """
    Main recommendation orchestration engine.
    """

    # -------------------------------------------------------------------------
    # FALLBACK IF NO API
    # -------------------------------------------------------------------------

    if client is None:

        return generate_local_fallback(
            enriched_subs_df,
            total_monthly_spend
        )

    # -------------------------------------------------------------------------
    # BUILD LLM CONTEXT
    # -------------------------------------------------------------------------

    summary_data = []

    for _, row in enriched_subs_df.head(15).iterrows():

        summary_data.append({

            "merchant_name":
                row.get("merchant_name", "Unknown"),

            "billing_frequency":
                row.get("billing_frequency", "Unknown"),

            "monthly_cost":
                round(
                    row.get(
                        "annual_projected_drain",
                        0
                    ) / 12,
                    2
                ),

            "category":
                row.get("category", "Unknown"),

            "price_anomaly":
                row.get(
                    "price_anomaly_detected",
                    False
                )
        })

    # -------------------------------------------------------------------------
    # PROMPT
    # -------------------------------------------------------------------------

    prompt = f"""
You are a financial optimization AI.

Analyze recurring subscriptions and generate insights.

MONTHLY SPEND:
${round(total_monthly_spend, 2)}

SUBSCRIPTIONS:
{json.dumps(summary_data, indent=2)}

Return ONLY valid JSON.

FORMAT:

{{
    "executive_summary": [
        "summary 1",
        "summary 2"
    ],
    "actionable_steps": [
        "action 1",
        "action 2"
    ]
}}
"""

    # -------------------------------------------------------------------------
    # LLM EXECUTION
    # -------------------------------------------------------------------------

    try:

        completion = client.chat.completions.create(

            model="llama3-8b-8192",

            messages=[

                {
                    "role": "system",
                    "content":
                        "You output only valid JSON."
                },

                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.3,

            response_format={
                "type": "json_object"
            }
        )

        raw_output = (
            completion
            .choices[0]
            .message
            .content
        )

        cleaned_output = clean_json_response(
            raw_output
        )

        parsed = json.loads(cleaned_output)

        # Safety validation

        if (
            "executive_summary" not in parsed
            or
            "actionable_steps" not in parsed
        ):

            raise ValueError(
                "Invalid JSON schema returned"
            )

        return parsed

    except Exception as e:

        print(
            f"[RECOMMENDATIONS] LLM failure: {str(e)}"
        )

        # Graceful fallback

        return generate_local_fallback(
            enriched_subs_df,
            total_monthly_spend
        )