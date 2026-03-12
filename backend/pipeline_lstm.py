import pickle as pkl
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
from sklearn.model_selection import train_test_split
import os
import tensorflow as tf
from tensorflow.keras.models import load_model
import re as re
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.preprocessing.sequence import pad_sequences

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  
spam_model = load_model(os.path.join(base_dir, 'saved-models', 'lstm-model.h5'))
with open(os.path.join(base_dir, 'saved-models', 'spam-categorizer.pkl'), 'rb') as f:
    cat_model = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'categorizer-vectorizer.pkl'), 'rb') as f:
    cat_vec = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'lstm-scaler.pkl'), 'rb') as f:
    spam_scaler = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models', 'lstm-label-encoder.pkl'),'rb') as f:
    spam_encoder = pkl.load(f)
with open(os.path.join(base_dir, 'saved-models','lstm-tokenizer.pkl'),'rb') as f:
    spam_tokenizer = pkl.load(f)

ham_features = ['me', 'my', 'can', 'lt', 'gt', 'ok', 'am', 'then', 'what', 'got']
spam_features = ['call', 'claim', 'http', 'prize', 'customer', 'paytm', 'please', 'your', 'message', '500','82242','uk','screaming']
smishing_features = ['txt', 'ringtone', 'stop', 'tone', 'freemsg', 'sms', '150p', 'tones', '50', 'text', '07781482378', 'landline', 'urgent','collection','conditions', 'visit', 'www', 'missing', 'holiday']

def get_word_importance(padded_text, text_features):
    padded_tensor = tf.constant(padded_text, dtype=tf.int32)
    features_tensor = tf.constant(text_features, dtype=tf.float32)
    
    embedding_layer = spam_model.get_layer('embedding')
    embeddings = tf.Variable(embedding_layer(padded_tensor), trainable=True)
    
    with tf.GradientTape() as tape:
        tape.watch(embeddings)
        # build a sub-model from embedding output onward
        x = embeddings
        for layer in spam_model.layers[2:]:  # skip sequence_input and embedding
            try:
                x = layer(x)
            except:
                break
        
        spam_idx = list(spam_encoder.classes_).index("spam")
        target = x[0][spam_idx]
    
    grads = tape.gradient(target, embeddings)
    importance = tf.reduce_sum(grads, axis=-1).numpy()[0]
    tokens = spam_tokenizer.sequences_to_texts([padded_text[0].tolist()])[0].split()
    importance_dict = {word: float(importance[i]) for i, word in enumerate(tokens) if word != '<OOV>'}
    importance_dict = dict(sorted(importance_dict.items(), key=lambda x: abs(x[1]), reverse=True))
    return importance_dict
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
    url_density = len(re.findall(r'http|www|bit\.ly|tinyurl', text.lower())) / len(text)
    currency_density = len(re.findall(r'\$|£|€|pound|dollar|gbp', text.lower())) / len(text) 
    return np.array([[length, ham, smishing, spam, caps_ratio, digit_ratio, punctuation_density, special_char_density, avg_word_length, repeated_word_density, url_density, currency_density]])


def spam_detect_lstm(text):
    spam_dictionary = {}
    text_in_array = [text]
    token_text = spam_tokenizer.texts_to_sequences(text_in_array)
    padded_text = pad_sequences(token_text, maxlen=80, padding = 'post', truncating = 'post')
    text_features = spam_scaler.transform(feature_extraction(text))
    probabilities = spam_model.predict([padded_text, text_features])
    threshold = 0.4
    spam_idx = list(spam_encoder.classes_).index("spam")
    smishing_idx = list(spam_encoder.classes_).index("smishing")
    probs = probabilities[0]
    if probs[spam_idx] > threshold:
        class_idx = spam_idx
    elif probs[smishing_idx] > threshold:
        class_idx = smishing_idx
    else:
        class_idx = np.argmax(probs)
    prediction = spam_encoder.inverse_transform([class_idx])[0]
    spam_dictionary['prediction'] = prediction  
    confidence = float(probabilities[0][class_idx])
    spam_dictionary['confidence'] = confidence
    tokens = spam_tokenizer.sequences_to_texts([padded_text[0].tolist()])[0].split()
    spam_dictionary['word_contributions'] = get_word_importance(padded_text, text_features) 
    if prediction == 'spam' or prediction == 'smishing':
        vec_cat = cat_vec.transform(text_in_array)
        cat_pred = cat_model.predict(vec_cat)[0]
        spam_dictionary['spam_type'] = cat_pred
        scores = cat_model.decision_function(vec_cat)[0]
        probs = np.exp(scores)/np.sum(np.exp(scores))
    else:
        spam_dictionary['spam_type'] = 'ham'
    print(spam_dictionary)
    return spam_dictionary    
    
print(spam_detect_lstm("Free entry in 2 a weekly competition! Text WIN to 80085 now!"))
print(spam_encoder.classes_)

