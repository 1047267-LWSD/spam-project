import pickle as pkl
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import os
import re as re
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  
with open(os.path.join(base_dir, 'saved-models', 'boost-detector.pkl'), 'rb') as f:
    spam_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'boost-vectorizer.pkl'), 'rb') as f:
    spam_vec = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'boost-scaler.pkl'), 'rb') as f:
    spam_scale = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'boost-encoder.pkl'), 'rb') as f:
    encoder = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'spam-categorizer.pkl'), 'rb') as f:
    cat_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'categorizer-vectorizer.pkl'), 'rb') as f:
    cat_vec = pkl.load(f)
ham_features = ['me', 'my', 'can', 'lt', 'gt', 'ok', 'am', 'then', 'what', 'got']
spam_features = ['call', 'claim', 'http', 'prize', 'customer', 'paytm', 'please', 'your', 'message', '500','82242','uk','screaming']
smishing_features = ['txt', 'ringtone', 'stop', 'tone', 'freemsg', 'sms', '150p', 'tones', '50', 'text', '07781482378', 'landline', 'urgent','collection','conditions', 'visit', 'www', 'missing', 'holiday']
def calculate_density(text, features):
    split_text = text.lower().split()
    if len(split_text)==0:
        return 0
    else:
        feature_count = 0
        for word in features:
            feature_count += split_text.count(word)
        return feature_count/len(split_text)

def ham_density(text):
    return calculate_density(text, ham_features)
def smishing_density(text):
    return calculate_density(text, smishing_features)
def spam_density(text):
    return calculate_density(text, spam_features)

def feature_extraction(text):
    ham = ham_density(text)
    spam = spam_density(text)
    smishing = smishing_density(text)
    length = max(len(text), 1)
    caps_ratio = len(re.findall(r'[A-Z]', text)) / max(len(text), 1)
    digit_ratio = len(re.findall(r'\d', text)) / max(len(text), 1)
    punctuation_density = len(re.findall(r'[!?.,;:]', text)) / max(len(text), 1)
    special_char_density = len(re.findall(r'[$@#%*&]', text))/max(len(text), 1)
    avg_word_length = np.mean([len(w) for w in text.split()]) if text.split() else 0
    repeated_word_density = len(re.findall(r'(.)\1{2,}', text)) / max(len(text), 1)
    return np.array([[ham, smishing, spam, length, caps_ratio, digit_ratio, punctuation_density, special_char_density, avg_word_length, repeated_word_density]])



def boost_detect(text):
    spam_dictionary = {}
    text_in_array = [text]
    vec_tfidf = spam_vec.transform(text_in_array)
    feature_indices = vec_tfidf.nonzero()[1]
    vec_text = spam_scale.transform(np.hstack([vec_tfidf.toarray(), feature_extraction(text)]))    
    prediction = spam_model.predict(vec_text)[0]
    prediction = encoder.inverse_transform([prediction])[0]
    spam_dictionary['prediction'] = prediction
    spam_prob = spam_model.predict_proba(vec_text)[0][list(encoder.classes_).index(prediction)]
    spam_dictionary['confidence'] = spam_prob

    words = spam_vec.get_feature_names_out()
    if prediction == 'spam' or prediction == 'smishing':
        vec_cat = cat_vec.transform(text_in_array)
        cat_pred = cat_model.predict(vec_cat)[0]
        spam_dictionary['spam_type'] = cat_pred
        scores = cat_model.decision_function(vec_cat)[0]
        probs = np.exp(scores)/np.sum(np.exp(scores))
        category_prob = probs[list(cat_model.classes_).index(cat_pred)]
        print(f"Text: {text_in_array[0]}, Spam type: {cat_pred},Spam Confidence:{spam_prob:.2f} Category Confidence: {category_prob:.2f}")
        feature_importances = spam_model.feature_importances_
        words = spam_vec.get_feature_names_out()
        spam_dictionary['word_contributions'] = {
            words[idx]: float(feature_importances[idx]) 
            for idx in feature_indices 
            if feature_importances[idx] > 0
}
    else:
        print(f"Text: {text_in_array[0]}, Spam type: {prediction}, Confidence: {spam_prob:.2f}")
        feature_importances = spam_model.feature_importances_
        words = spam_vec.get_feature_names_out()
        spam_dictionary['word_contributions'] = {
            words[idx]: float(feature_importances[idx]) 
            for idx in feature_indices
                if feature_importances[idx] > 0
        }
    return spam_dictionary      

