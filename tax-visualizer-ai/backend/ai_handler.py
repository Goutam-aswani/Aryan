
from langchain_groq import ChatGroq

GROK_API_KEY = os.getenv("GROKAPI")
llm = ChatGroq(model ="llama-3.1-8b-instant" ,api_key=GROK_API_KEY)

def ask_ai(data):
    query = data.get("query", "")
    context = data.get("context", "")
    calc = data.get("calculation_context")
    calc_block = ""
    if calc:
        # summarize the important fields for the model
        old = calc.get('old_regime', {})
        new = calc.get('new_regime', {})
        calc_block = (
            "\n\n--- Latest Calculation ---\n"
            f"Old Regime: taxable_income={old.get('taxable_income')}, tax={old.get('tax')}\n"
            f"New Regime: taxable_income={new.get('taxable_income')}, tax={new.get('tax')}\n"
        )
    prompt = f"{context}\nUser: {query}"
    if calc_block:
        prompt = prompt + calc_block
    try:
        response = llm.invoke(prompt)
        return {"response": response.content}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}
