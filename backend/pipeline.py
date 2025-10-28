import pickle as pkl
import numpy as np
import pandas as pd
import shap
import os 
base_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(base_dir, 'saved-models', 'spam-detector.pkl'), 'rb') as f:
    spam_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'detector-vectorizer.pkl'), 'rb') as f:
    spam_vec = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'spam-categorizer.pkl'), 'rb') as f:
    cat_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'categorizer-vectorizer.pkl'), 'rb') as f:
    cat_vec = pkl.load(f)
background = pd.read_csv('datasets/hamspam.csv', encoding='latin-1', on_bad_lines='skip')['v2']
background_vec = spam_vec.transform(background)
explainer = shap.LinearExplainer(spam_model, background_vec)
spam_dictionary = {}
def spam_detect(text):
    spam_dictionary = {} 
    text_in_array = [text]
    spam_dictionary['text'] = text

    vec_text = spam_vec.transform(text_in_array)
    prediction = spam_model.predict(vec_text)[0]
    spam_dictionary['prediction'] = prediction

    spam_prob = spam_model.predict_proba(vec_text)[0][list(spam_model.classes_).index(prediction)]
    spam_dictionary['confidence'] = spam_prob

    shap_values = explainer.shap_values(vec_text)
    words = spam_vec.get_feature_names_out()
    feature_indices = vec_text.nonzero()[1]
    spam_dictionary['word_contributions'] = {words[idx]: shap_values[0][idx] for idx in feature_indices}
    if prediction == 'spam':
        vec_cat = cat_vec.transform(text_in_array)
        cat_pred = cat_model.predict(vec_cat)[0]
        spam_dictionary['spam_type'] = cat_pred

        scores = cat_model.decision_function(vec_cat)[0]
        probs = np.exp(scores)/np.sum(np.exp(scores))
        category_prob = probs[list(cat_model.classes_).index(cat_pred)]

        print(f"Text: {text_in_array[0]}, Spam type: {cat_pred}, Spam Confidence: {spam_prob:.2f}, Category Confidence: {category_prob:.2f}")
        for idx in feature_indices:
            print(f"{words[idx]}: {shap_values[0][idx]:.3f}")

    else:
        print(f"Text: {text_in_array[0]}, Spam type: {prediction}, Confidence: {spam_prob:.2f}")
        for idx in feature_indices:
            print(f"{words[idx]}: {shap_values[0][idx]:.3f}")

    return spam_dictionary
