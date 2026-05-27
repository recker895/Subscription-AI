import pandas as pd

# ==========================================
# LOAD DATASET
# ==========================================
print("Loading dataset...")

df = pd.read_csv("../data/transactions_data.csv")

print("Dataset loaded successfully")

# ==========================================
# SHOW ORIGINAL INFO
# ==========================================
print("\nOriginal Shape:")
print(df.shape)

print("\nOriginal Data Types:\n")
print(df.dtypes)

# ==========================================
# CLEAN AMOUNT COLUMN
# ==========================================
print("\nCleaning amount column...")

df["amount"] = (
    df["amount"]
    .replace(r"[\$,]", "", regex=True)
    .astype(float)
)

print("Amount column cleaned")

# ==========================================
# CONVERT DATE COLUMN
# ==========================================
print("\nConverting date column...")

df["date"] = pd.to_datetime(df["date"])

print("Date column converted")

# ==========================================
# REMOVE NEGATIVE VALUES
# ==========================================
print("\nRemoving negative transactions...")

df = df[df["amount"] > 0]

print("Negative transactions removed")

# ==========================================
# SHOW CLEANED DATA
# ==========================================
print("\nCleaned Data Preview:\n")

print(df.head())

# ==========================================
# FINAL DATASET INFO
# ==========================================
print("\nFinal Shape:")
print(df.shape)

print("\nFinal Data Types:\n")
print(df.dtypes)

# ==========================================
# SAVE CLEANED DATA
# ==========================================
print("\nSaving cleaned dataset...")

df.to_csv("../data/cleaned_transactions.csv", index=False)

print("cleaned_transactions.csv saved successfully")