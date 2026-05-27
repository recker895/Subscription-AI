from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd

app = FastAPI()

# =====================================================
# CORS CONFIGURATION
# =====================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# =====================================================
# HOME ROUTE
# =====================================================

@app.get("/")
def home():

    return {
        "message": "Backend running successfully"
    }

# =====================================================
# ANALYZE ROUTE
# =====================================================

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...)
):

    try:

        # =============================================
        # READ CSV
        # =============================================

        df = pd.read_csv(file.file)

        print(df.head())

        print(df.columns)

        # =============================================
        # AUTO COLUMN DETECTION
        # =============================================

        columns_lower = {

            col.lower(): col

            for col in df.columns
        }

        amount_col = None
        merchant_col = None
        category_col = None

        # =============================================
        # AMOUNT COLUMN
        # =============================================

        for possible in [

            "amount",
            "price",
            "transaction_amount",
            "cost",
            "payment",
            "value",
        ]:

            if possible in columns_lower:

                amount_col = columns_lower[possible]
                break

        # =============================================
        # MERCHANT COLUMN
        # =============================================

        for possible in [

            "merchant",
            "vendor",
            "merchant_name",
            "company",
            "subscription_name",
            "name",
        ]:

            if possible in columns_lower:

                merchant_col = columns_lower[possible]
                break

        # =============================================
        # CATEGORY COLUMN
        # =============================================

        for possible in [

            "category",
            "type",
            "subscription_type",
            "group",
        ]:

            if possible in columns_lower:

                category_col = columns_lower[possible]
                break

        # =============================================
        # VALIDATION
        # =============================================

        if not amount_col:

            return {
                "error":
                "No amount column found"
            }

        if not merchant_col:

            return {
                "error":
                "No merchant column found"
            }

        # fallback category

        if not category_col:

            df["AUTO_CATEGORY"] = "General"

            category_col = "AUTO_CATEGORY"

        # =============================================
        # CLEAN DATA
        # =============================================

        df = df.dropna()

        df[amount_col] = pd.to_numeric(

            df[amount_col],

            errors="coerce"
        )

        df = df.dropna(

            subset=[amount_col]
        )

        # =============================================
        # BASIC METRICS
        # =============================================

        total_transactions = len(df)

        total_spending = float(

            df[amount_col].sum()
        )

        unique_merchants = int(

            df[merchant_col].nunique()
        )

        # =============================================
        # CATEGORY DISTRIBUTION
        # =============================================

        category_distribution = (

            df[category_col]

            .value_counts()

            .to_dict()
        )

        # =============================================
        # TIMELINE DATA
        # =============================================

        active_subscriptions = []

        grouped = (

            df.groupby(merchant_col)[amount_col]

            .mean()

            .reset_index()
        )

        for _, row in grouped.iterrows():

            active_subscriptions.append({

                "billing_frequency":
                    str(row[merchant_col]),

                "monthly_price":
                    round(float(row[amount_col]), 2)
            })

        # =============================================
        # RESPONSE
        # =============================================

        return {

            "analysis": {

                "total_transactions":
                    total_transactions,

                "total_spending":
                    round(total_spending, 2),

                "subscriptions_detected":
                    len(active_subscriptions),

                "unique_merchants":
                    unique_merchants,

                "estimated_savings":
                    round(total_spending * 0.15, 2),

                "category_distribution":
                    category_distribution,

                "active_subscriptions":
                    active_subscriptions,
            }
        }

    except Exception as e:

        return {
            "error": str(e)
        }