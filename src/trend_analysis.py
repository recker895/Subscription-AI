import pandas as pd

# ==========================================
# LOAD CATEGORIZED SUBSCRIPTIONS
# ==========================================
print("Loading categorized subscriptions...")

df = pd.read_csv(
    "../output/categorized_subscriptions.csv"
)

print("Dataset loaded successfully")

# ==========================================
# CATEGORY-WISE SPENDING
# ==========================================
print("\nCalculating category-wise spending...")

category_spending = (
    df.groupby("category")
    .agg({
        "avg_amount": "sum",
        "transaction_count": "sum"
    })
    .reset_index()
)

category_spending.columns = [
    "category",
    "total_avg_spending",
    "total_transactions"
]

# ==========================================
# SORT BY SPENDING
# ==========================================
category_spending = category_spending.sort_values(
    by="total_avg_spending",
    ascending=False
)

# ==========================================
# DISPLAY RESULTS
# ==========================================
print("\nTop Spending Categories:\n")

print(category_spending.head(20))

# ==========================================
# TOP RECURRING CATEGORIES
# ==========================================
print("\nMost Recurring Categories:\n")

top_recurring = category_spending.sort_values(
    by="total_transactions",
    ascending=False
)

print(top_recurring.head(20))

# ==========================================
# HIGH-SPENDING USERS
# ==========================================
print("\nAnalyzing high-spending users...")

user_spending = (
    df.groupby("client_id")
    .agg({
        "avg_amount": "sum",
        "transaction_count": "sum"
    })
    .reset_index()
)

user_spending.columns = [
    "client_id",
    "total_subscription_spending",
    "total_subscription_transactions"
]

user_spending = user_spending.sort_values(
    by="total_subscription_spending",
    ascending=False
)

print("\nTop Subscription Spenders:\n")

print(user_spending.head(20))

# ==========================================
# SAVE OUTPUTS
# ==========================================
category_spending.to_csv(
    "../output/category_spending_analysis.csv",
    index=False
)

user_spending.to_csv(
    "../output/user_spending_analysis.csv",
    index=False
)

print("\nTrend analysis files saved successfully")