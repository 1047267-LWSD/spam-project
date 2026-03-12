#Import Libraries
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import GridSearchCV
from tensorflow.keras.layers import Input, concatenate
from tensorflow.keras.models import Model
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
import numpy as np
import shap
from sklearn.datasets import make_classification
from sklearn.feature_selection import mutual_info_classif
import re
import pickle as pkl 

#Feature Engineering
df = pd.read_csv('datasets/hamspam2.csv')

df['length'] = (df['TEXT'].str.len())

ham_features = ['me', 'my', 'can', 'lt', 'gt', 'ok', 'am', 'then', 'what', 'got']
spam_features = ['call', 'claim', 'http', 'prize', 'customer', 'paytm', 'please', 'your', 'message', '500','82242','uk','screaming']
smishing_features = ['txt', 'ringtone', 'stop', 'tone', 'freemsg', 'sms', '150p', 'tones', '50', 'text', '07781482378', 'landline', 'urgent','collection','conditions', 'visit', 'www', 'missing', 'holiday']
financial_features = ['money', 'cash', 'prize', 'reward', 'free', 'win', 'winner', 'claim']
authority_features = ['bank', 'government', 'irs', 'police', 'medicare', 'social security', 'customer']

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
def finance_density(text):
    return calculate_density(text,financial_features)
def authority_density(text):
    return calculate_density(text, authority_features)
df['ham_density'] = df['TEXT'].apply(ham_density)
df['smishing_density'] = df['TEXT'].apply(smishing_density)
df['spam_density'] = df['TEXT'].apply(spam_density)
df['exclamation_ratio'] = df['TEXT'].str.count('!') / df['TEXT'].str.len()
df['caps_ratio'] = df['TEXT'].str.count(r'[A-Z]') / df['TEXT'].str.len()
df['digit_ratio'] = df['TEXT'].str.count(r'\d') / df['TEXT'].str.len()
df['punctuation_density'] = df['TEXT'].str.count(r'[!?.,;:]') / df['TEXT'].str.len()
df['special_char_density'] = df['TEXT'].str.count(r'[$@#%*&]')/df['TEXT'].str.len()
df['avg_word_length'] = df['TEXT'].apply(lambda x: np.mean([len(w) for w in x.split()]) if x.split() else 0)
df['repeated_word_density'] = df['TEXT'].str.count(r'(.)\1{2,}') / df['TEXT'].str.len()
df['url_density'] = df['TEXT'].str.count(r'http|www|bit\.ly|tinyurl') / df['TEXT'].str.len()
df['currency_density'] = df['TEXT'].str.count(r'\$|£|€|pound|dollar|gbp') / df['TEXT'].str.len()

def feature_extraction(text):
    return [
        len(text),
        ham_density(text), smishing_density(text), spam_density(text),
        sum(1 for c in text if c.isupper()) / len(text),
        sum(1 for c in text if c.isdigit()) / len(text),
        (text.count('!') + text.count('?') + text.count('.') + text.count(',') + text.count(';') + text.count(':')) / len(text),
        sum(1 for c in text if c in '#$%&*@') / len(text),
        np.mean([len(word) for word in text.split()]),
        word_density(text),
        len(re.findall(r'http|www|bit\.ly|tinyurl', text.lower())) / len(text),  # url_density
        len(re.findall(r'\$|£|€|pound|dollar|gbp', text.lower())) / len(text)   # currency_density
    ]

def word_density(text):
    words = text.lower().split()
    count = 0
    word_counts = {}
    for word in words:
        if word not in word_counts:
            word_counts[word] = 1
        else:
            word_counts[word] = word_counts[word] + 1
    count = sum(1 for word in word_counts.values() if word > 1)
    return count/len(words) if len(word_counts) > 0 else 0
print(df.head(10))

y = df['LABEL']

enhanced_features = df[['length', 'ham_density', 'smishing_density', 'spam_density', 
                       'caps_ratio', 'digit_ratio', 'punctuation_density', 'special_char_density', 
                       'avg_word_length', 'repeated_word_density', 'url_density', 'currency_density']]

mi_scores = mutual_info_classif(enhanced_features, y)

feature_names = ['length', 'ham_density', 'smishing_density', 'spam_density', 
                       'caps_ratio', 'digit_ratio', 'punctuation_density', 'special_char_density', 
                       'avg_word_length', 'repeated_word_density', 'url_density', 'currency_density']
for name, score in zip(feature_names, mi_scores):
    print(f"{name}: {score:.4f}")

#Data Preprocessing
X = df['TEXT']
y = df['LABEL']
X_train, X_test, y_train, y_test, enhanced_train, enhanced_test = train_test_split(
    X, y, enhanced_features, test_size=0.2, random_state=0)
X_test_test = X_test
tokenizer = Tokenizer(num_words=5000, oov_token = '<OOV>')
tokenizer.fit_on_texts(X_train)
X_train = tokenizer.texts_to_sequences(X_train)
X_test = tokenizer.texts_to_sequences(X_test)
label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)
y_test_encoded = label_encoder.transform(y_test)
X_train_pad = pad_sequences(X_train, maxlen=80)
X_test_pad = pad_sequences(X_test, maxlen=80)
enhanced_train_scaled = scaler.fit_transform(enhanced_train.values)
enhanced_test_scaled = scaler.transform(enhanced_test)      

#Model Inputs (with new features)
sequence_input = Input(shape=(80,), name='sequence_input')
features_input = Input(shape=(12,), name='features_input') 

#Model Declaration and Training
embedding = Embedding(input_dim=5000, output_dim=24)(sequence_input)
lstm1 = LSTM(units=128, return_sequences=True)(embedding)
dropout1 = Dropout(0.5)(lstm1)
lstm2 = LSTM(units=128, return_sequences=True)(dropout1)
dropout2 = Dropout(0.5)(lstm2)
lstm3 = LSTM(units=128, return_sequences=True)(dropout2)
dropout3 = Dropout(0.5)(lstm3)
lstm4 = LSTM(units=128)(dropout3)
dropout4 = Dropout(0.5)(lstm4)
dense_features = Dense(64, activation='relu')(features_input)
dropout_features = Dropout(0.5)(dense_features)

combined = concatenate([dropout4, dropout_features])
dense1 = Dense(500, activation='relu')(combined)
dropout4 = Dropout(0.5)(dense1)
dense2 = Dense(500, activation='relu')(dropout4)
dropout5 = Dropout(0.5)(dense2)
output = Dense(3, activation='softmax')(dropout5)

model = Model(inputs=[sequence_input, features_input], outputs=output)
model.compile(optimizer = 'adam', loss='sparse_categorical_crossentropy', metrics = ['accuracy'])
early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
history = model.fit([X_train_pad, enhanced_train_scaled], y_train_encoded, epochs=100, batch_size=32, validation_split=0.2, callbacks=[early_stopping])
predictions = model.predict([X_test_pad, enhanced_test_scaled])  

#Model Testing and Metrics
y_pred_proba = model.predict([X_test_pad, enhanced_test_scaled])  
y_pred = np.argmax(y_pred_proba, axis=1)

print("Accuracy:", accuracy_score(y_test_encoded, y_pred))
print("Confusion Matrix:")
print(confusion_matrix(y_test_encoded, y_pred))

y_pred_labels = label_encoder.inverse_transform(y_pred)
y_test_labels = label_encoder.inverse_transform(y_test_encoded)
print("Classification Report:")
print(classification_report(y_test_labels, y_pred_labels))

model.save('lstm-model.h5')

with open('lstm-scaler.pkl', 'wb') as f:
    pkl.dump(scaler, f)
with open('lstm-tokenizer.pkl', 'wb') as f:
    pkl.dump(tokenizer, f)
with open('lstm-label-encoder.pkl', 'wb') as f:
    pkl.dump(label_encoder, f)