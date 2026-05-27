import pandas as pd

print("Loading recurring subscriptions dataset...")

# Load recurring patterns dataset
df = pd.read_csv("../output/detected_subscriptions.csv")

print("Dataset loaded successfully")

print("\nOriginal Shape:")
print(df.shape)

print("\nApplying subscription filtering rules...")

# -----------------------------------
# RULE 1: Stable Amounts
# Lower variability means more likely subscription
# -----------------------------------

df["amount_variation"] = df["amount_std"] / df["avg_amount"]

stable_df = df[
    df["amount_variation"] < 0.25
]

print("\nAfter Amount Stability Filter:")
print(stable_df.shape)

# -----------------------------------
# RULE 2: Monthly Frequency
# Remove extremely frequent merchants
# -----------------------------------

frequency_df = stable_df[
    stable_df["monthly_frequency"] <= 5
]

print("\nAfter Monthly Frequency Filter:")
print(frequency_df.shape)

# -----------------------------------
# RULE 3: Active Duration
# Subscription should exist for long duration
# -----------------------------------

final_df = frequency_df[
    frequency_df["active_days"] >= 90
]

print("\nAfter Active Duration Filter:")
print(final_df.shape)

# -----------------------------------
# Sorting
# -----------------------------------

final_df = final_df.sort_values(
    by="transaction_count",
    ascending=False
)

print("\nPossible TRUE Subscriptions:\n")

print(
    final_df[
        [
            "client_id",
            "merchant_id",
            "avg_amount",
            "transaction_count",
            "monthly_frequency",
            "active_days"
        ]
    ].head(20)
)

# -----------------------------------
# Save Output
# -----------------------------------

final_df.to_csv(
    "../output/final_subscriptions.csv",
    index=False
)

print("\nfinal_subscriptions.csv saved successfully")