from flask import Flask, render_template, request, jsonify
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder # type: ignore
import os

app = Flask(__name__)

# Load and Preprocess Data from JSON
def train_model():
    # Make sure the file exists
    if not os.path.exists('drug_data.json'):
        print("Error: drug_data.json not found!")
        return None, None, None, None

    # Reading the JSON file
    df = pd.read_json('drug_data.json')
    
    # Encoders for Categorical Data
    le_sex = LabelEncoder()
    le_bp = LabelEncoder()
    le_chol = LabelEncoder()
    
    # F=0, M=1 | HIGH=0, LOW=1, NORMAL=2 | HIGH=0, NORMAL=1
    df['Sex_n'] = le_sex.fit_transform(df['Sex']) 
    df['BP_n'] = le_bp.fit_transform(df['BP'])   
    df['Chol_n'] = le_chol.fit_transform(df['Cholesterol']) 
    
    X = df[['Age', 'Sex_n', 'BP_n', 'Chol_n', 'Na_to_K']]
    y = df['Drug']
    
    model = DecisionTreeClassifier()
    model.fit(X, y)
    
    return model, le_sex, le_bp, le_chol

# Train the model once when the app starts
model, le_sex, le_bp, le_chol = train_model()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Mappings based on alphabetical order used by LabelEncoder
        sex = 0 if data['sex'] == 'F' else 1
        bp_map = {'HIGH': 0, 'LOW': 1, 'NORMAL': 2}
        chol_map = {'HIGH': 0, 'NORMAL': 1}
        
        bp = bp_map[data['bp']]
        chol = chol_map[data['cholesterol']]
        
        prediction = model.predict([[
            int(data['age']), 
            sex, 
            bp, 
            chol, 
            float(data['na_to_k'])
        ]])
        
        return jsonify({'drug': prediction[0]})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)