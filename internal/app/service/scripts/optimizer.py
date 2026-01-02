import sys
import json
import pandas as pd
from FSRS_Optimizer import Optimizer

def optimize(data_path):
    # 1. Load Data
    # Expected format: JSON list of dicts or CSV
    # We need columns: card_id, rating, duration, review_time (timestamp)
    try:
        df = pd.read_json(data_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read data: {str(e)}"}))
        return

    # 2. Rename columns to match FSRS Optimizer requirements
    # FSRS expects: card_id, review_date, rating, state (optional but good)
    # Our DB: id, card_id, rating, created_at, state
    df.rename(columns={
        'created_at': 'review_date', 
        'rating': 'rating',
        'state': 'state' # strictly speaking optimizer infers state from history, but let's keep it standard
    }, inplace=True)

    # 3. Run Optimization
    optimizer = Optimizer()
    try:
        optimizer.define_model()
        # timezone handling might be needed depending on how Go exports time
        df['review_date'] = pd.to_datetime(df['review_date']).astype(int) // 10**6 # pyright: ignore[reportAttributeAccessIssue] # ms timestamp?
        
        # Note: Actual fsrs-optimizer API might vary slightly by version.
        # This is a conceptual implementation. 
        # Usually: optimizer.S_t = ...
        # For simple use, we might just train on the dataset.
        
        optimizer.train(df)
        
        # 4. Output Weights
        print(json.dumps({
            "parameters": optimizer.w,
            "status": "success"
        }))
    except Exception as e:
         print(json.dumps({"error": f"Optimization failed: {str(e)}"}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No data file provided"}))
        sys.exit(1)
    optimize(sys.argv[1])
