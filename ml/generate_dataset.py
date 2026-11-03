import pandas as pd
import numpy as np
import random

# -----------------------------
# Reproducibility
# -----------------------------
np.random.seed(42)
random.seed(42)

# -----------------------------
# Configuration
# -----------------------------
N_ROWS = 2000
OUTPUT_FILE = "elderly_incentive_dataset.csv"

# -----------------------------
# Scoring helpers
# -----------------------------
def get_age_group(age: int) -> str:
    if age < 60:
        return "<60"
    elif age <= 64:
        return "60-64"
    elif age <= 69:
        return "65-69"
    elif age <= 74:
        return "70-74"
    elif age <= 79:
        return "75-79"
    else:
        return "80+"

def get_age_score(age: int) -> int:
    if age < 60:
        return 0
    elif age <= 64:
        return 1
    elif age <= 69:
        return 2
    elif age <= 74:
        return 3
    elif age <= 79:
        return 4
    else:
        return 5

def get_income_score(income: int) -> int:
    if income < 50000:
        return 3
    elif income <= 100000:
        return 1
    else:
        return 0

def get_employment_score(status: str) -> int:
    return 2 if status == "Unemployed" else 0

def get_health_score(status: str) -> int:
    if status == "Poor":
        return 3
    elif status == "Fair":
        return 1
    return 0

def get_disability_score(status: str) -> int:
    return 2 if status == "Yes" else 0

def get_chronic_illness_score(status: str) -> int:
    return 2 if status == "Yes" else 0

def get_housing_score(status: str) -> int:
    if status == "Homeless":
        return 3
    elif status == "Rented":
        return 1
    return 0

def get_family_support_score(level: str) -> int:
    if level == "Low":
        return 2
    elif level == "Medium":
        return 1
    return 0

def get_caregiver_score(status: str) -> int:
    return 2 if status == "No" else 0

def get_healthcare_access_score(access: str) -> int:
    return 2 if access == "Difficult" else 0

def get_national_id_score(status: str) -> int:
    return -2 if status == "No" else 0

def get_location_score(location: str) -> int:
    return 1 if location == "Rural" else 0

# -----------------------------
# Row generation
# -----------------------------
def generate_row() -> dict:
    # Age: include some under-60 records for testing auto-rejection
    age = np.random.randint(55, 91)
    age_group = get_age_group(age)

    gender = np.random.choice(["Male", "Female"])
    marital_status = np.random.choice(["Single", "Married", "Widowed"])
    living_arrangement = np.random.choice(["Alone", "With Family"])

    # Income bands with more realistic spread
    income = int(np.random.choice(
        [
            np.random.randint(10000, 49999),
            np.random.randint(50000, 100000),
            np.random.randint(100001, 150000)
        ],
        p=[0.55, 0.30, 0.15]
    ))

    # Slightly more realistic employment distribution for elderly citizens
    employment_status = np.random.choice(["Employed", "Unemployed"], p=[0.25, 0.75])

    pension = np.random.choice(["Yes", "No"], p=[0.35, 0.65])
    housing_status = np.random.choice(["Owned", "Rented", "Homeless"], p=[0.55, 0.40, 0.05])

    # Older people are more likely to have worse health
    if age >= 80:
        health_status = np.random.choice(["Good", "Fair", "Poor"], p=[0.15, 0.35, 0.50])
    elif age >= 75:
        health_status = np.random.choice(["Good", "Fair", "Poor"], p=[0.20, 0.45, 0.35])
    elif age >= 70:
        health_status = np.random.choice(["Good", "Fair", "Poor"], p=[0.25, 0.50, 0.25])
    elif age >= 65:
        health_status = np.random.choice(["Good", "Fair", "Poor"], p=[0.35, 0.45, 0.20])
    else:
        health_status = np.random.choice(["Good", "Fair", "Poor"], p=[0.45, 0.40, 0.15])

    disability = np.random.choice(["Yes", "No"], p=[0.22, 0.78])
    chronic_illness = np.random.choice(["Yes", "No"], p=[0.30, 0.70])
    healthcare_access = np.random.choice(["Easy", "Difficult"], p=[0.65, 0.35])

    dependents = int(np.random.randint(0, 7))
    caregiver = np.random.choice(["Yes", "No"], p=[0.60, 0.40])
    family_support = np.random.choice(["Low", "Medium", "High"], p=[0.30, 0.45, 0.25])

    location = np.random.choice(["Urban", "Rural"], p=[0.60, 0.40])
    cost_of_living = int(np.random.randint(1, 10))
    national_id = np.random.choice(["Yes", "No"], p=[0.85, 0.15])

    # -----------------------------
    # Policy rule: under 60 = not eligible
    # -----------------------------
    if age < 60:
        score = 0
        eligible = 0
    else:
        score = 0
        score += get_age_score(age)
        score += get_income_score(income)
        score += get_employment_score(employment_status)
        score += get_health_score(health_status)
        score += get_disability_score(disability)
        score += get_chronic_illness_score(chronic_illness)
        score += get_housing_score(housing_status)
        score += get_family_support_score(family_support)
        score += get_caregiver_score(caregiver)
        score += get_healthcare_access_score(healthcare_access)
        score += get_national_id_score(national_id)
        score += get_location_score(location)

        # Final eligibility threshold
        eligible = 1 if score >= 10 else 0

        # Small controlled noise to make the dataset less perfect
        if random.random() < 0.05:
            eligible = 1 - eligible

    return {
        "age": age,
        "age_group": age_group,
        "gender": gender,
        "marital_status": marital_status,
        "living_arrangement": living_arrangement,
        "income": income,
        "employment_status": employment_status,
        "pension": pension,
        "housing_status": housing_status,
        "health_status": health_status,
        "disability": disability,
        "chronic_illness": chronic_illness,
        "healthcare_access": healthcare_access,
        "dependents": dependents,
        "caregiver": caregiver,
        "family_support": family_support,
        "location": location,
        "cost_of_living": cost_of_living,
        "national_id": national_id,
        "score": score,
        "eligible": eligible
    }

# -----------------------------
# Generate dataset
# -----------------------------
rows = [generate_row() for _ in range(N_ROWS)]
df = pd.DataFrame(rows)

# Optional: reorder columns neatly
df = df[
    [
        "age", "age_group", "gender", "marital_status", "living_arrangement",
        "income", "employment_status", "pension", "housing_status",
        "health_status", "disability", "chronic_illness", "healthcare_access",
        "dependents", "caregiver", "family_support", "location",
        "cost_of_living", "national_id", "score", "eligible"
    ]
]

# Save to CSV
df.to_csv(OUTPUT_FILE, index=False)

print(f"Dataset saved to: {OUTPUT_FILE}")
print(f"Rows: {len(df)}")
print("\nSample rows:")
print(df.head(10).to_string(index=False))
print("\nEligibility distribution:")
print(df["eligible"].value_counts().to_string())