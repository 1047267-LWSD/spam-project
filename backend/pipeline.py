import pickle as pkl
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import shap
import os
import re as re
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  
with open(os.path.join(base_dir, 'saved-models', 'spam-detector.pkl'), 'rb') as f:
    spam_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'detector-vectorizer.pkl'), 'rb') as f:
    spam_vec = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'spam-scaler.pkl'), 'rb') as f:
    spam_scale = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'spam-categorizer.pkl'), 'rb') as f:
    cat_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'categorizer-vectorizer.pkl'), 'rb') as f:
    cat_vec = pkl.load(f)

def feature_extraction(text):
    length = max(len(text), 1)
    caps_ratio = len(re.findall(r'[A-Z]', text)) / max(len(text), 1)
    digit_ratio = len(re.findall(r'\d', text)) / max(len(text), 1)
    punctuation_density = len(re.findall(r'[!?.,;:]', text)) / max(len(text), 1)
    special_char_density = len(re.findall(r'[$@#%*&]', text))/max(len(text), 1)
    avg_word_length = np.mean([len(w) for w in text.split()]) if text.split() else 0
    repeated_word_density = len(re.findall(r'(.)\1{2,}', text)) / max(len(text), 1)
    return np.array([[length, caps_ratio, digit_ratio, punctuation_density, special_char_density, avg_word_length, repeated_word_density]])

background = pd.read_csv(os.path.join(base_dir, 'datasets', 'hamspam2.csv'), encoding='latin-1', on_bad_lines='skip').sample(100, random_state=0)
background_vec = spam_scale.transform(np.hstack([spam_vec.transform(background['TEXT']).toarray(), np.vstack(background['TEXT'].apply(feature_extraction))]))
explainer = shap.LinearExplainer(spam_model, background_vec)

def spam_detect(text):
    spam_dictionary = {}
    text_in_array = [text]
    vec_tfidf = spam_vec.transform(text_in_array)
    feature_indices = vec_tfidf.nonzero()[1]
    vec_text = spam_scale.transform(np.hstack([vec_tfidf.toarray(), feature_extraction(text)]))    
    prediction = spam_model.predict(vec_text)[0]
    spam_dictionary['prediction'] = prediction
    spam_prob = spam_model.predict_proba(vec_text)[0][list(spam_model.classes_).index(prediction)]
    spam_dictionary['confidence'] = spam_prob
    shap_values = explainer.shap_values(vec_text)
    words = spam_vec.get_feature_names_out()
    spam_dictionary['word_contributions'] = {words[idx]: shap_values[list(spam_model.classes_).index(prediction)][0][idx] for idx in feature_indices}
    if prediction == 'spam' or prediction == 'smishing':
        vec_cat = cat_vec.transform(text_in_array)
        cat_pred = cat_model.predict(vec_cat)[0]
        spam_dictionary['spam_type'] = cat_pred
        scores = cat_model.decision_function(vec_cat)[0]
        probs = np.exp(scores)/np.sum(np.exp(scores))
        category_prob = probs[list(cat_model.classes_).index(cat_pred)]
        print(f"Text: {text_in_array[0]}, Spam type: {cat_pred},Spam Confidence:{spam_prob:.2f} Category Confidence: {category_prob:.2f}")
        class_idx = list(spam_model.classes_).index(prediction)
        for idx in feature_indices:
            print(f"{words[idx]}: {shap_values[class_idx][0][idx]:.3f}")
    else:
        print(f"Text: {text_in_array[0]}, Spam type: {prediction}, Confidence: {spam_prob:.2f}")
        class_idx = list(spam_model.classes_).index(prediction)
        for idx in feature_indices:
            print(f"{words[idx]}: {shap_values[class_idx][0][idx]:.3f}")
    return spam_dictionary      

spam_detect("Free entry in 2 a weekly competition! Text WIN to 80085 now!")
spam_detect("Hey, are we still meeting for lunch today?")
