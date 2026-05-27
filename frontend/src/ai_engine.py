from groq import Groq
from dotenv import load_dotenv
import os

# ==========================================
# LOAD ENV VARIABLES
# ==========================================

load_dotenv()

# ==========================================
# INITIALIZE GROQ CLIENT
# ==========================================

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# ==========================================
# GENERATE AI INSIGHTS
# ==========================================

def generate_ai_insights(metrics):

    prompt = f"""

    Analyze this user's subscription spending.

    Total Transactions:
    {metrics['total_transactions']}

    Total Spending:
    ${metrics['total_spending']}

    Unique Merchants:
    {metrics['unique_merchants']}

    Estimated Savings:
    ${metrics['estimated_savings']}

    Generate:

    1. Financial health analysis
    2. Subscription optimization advice
    3. Spending behavior insights
    4. Savings recommendations
    5. Risk observations

    Keep response professional and concise.
    """

    response = client.chat.completions.create(

        model="llama3-70b-8192",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.7
    )

    return response.choices[0].message.content