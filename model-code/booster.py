import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.model_selection import GridSearchCV
from xgboost import XGBClassifier
import numpy as np
import shap
import pandas as pd
import numpy as np
from sklearn.datasets import make_classification
from sklearn.feature_selection import mutual_info_classif
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import LabelEncoder
import pickle as pkl

scaler = StandardScaler()
df = pd.read_csv('datasets/hamspam2.csv', encoding='latin1', quotechar='"', skipinitialspace=True)[['LABEL','TEXT']]
print(df.head())
print(df['LABEL'].unique())
print(df['LABEL'].value_counts())

df['length'] = (df['TEXT'].str.len())
encoder = LabelEncoder()
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

X = df['TEXT']
y = df['LABEL']
enhanced_features = df[['ham_density', 'smishing_density', 'spam_density', 'length', 'caps_ratio','digit_ratio','punctuation_density', 'special_char_density', 'avg_word_length', 'repeated_word_density']]

mi_scores = mutual_info_classif(enhanced_features, y)

feature_names = ['ham_density', 'smishing_density', 'spam_density', 'length', 'caps_ratio','digit_ratio','punctuation_density', 'special_char_density', 'avg_word_length', 'repeated_word_density']

for name, score in zip(feature_names, mi_scores):
    print(f"{name}: {score:.4f}")

#Data Preprocessing

X_train, X_test, y_train, y_test, enhanced_train, enhanced_test = train_test_split(
    X, y, enhanced_features, test_size=0.2, random_state=0)
vectorizer = TfidfVectorizer()
X_test_test = X_test
X_train_train = X_train
X_train = vectorizer.fit_transform(X_train)
X_test = vectorizer.transform(X_test)
y_train = encoder.fit_transform(y_train)
y_test = encoder.transform(y_test)

X_train_enhanced = scaler.fit_transform(np.hstack([X_train.toarray(), enhanced_train]))
X_test_enhanced = scaler.transform(np.hstack([X_test.toarray(), enhanced_test]))


#Model Declaration and Training
model = XGBClassifier(n_estimators = 500, max_depth = 1000, learning_rate = 0.01)
model.fit((X_train_enhanced), y_train)

#Model Testing and Metrics
y_pred = model.predict(X_test_enhanced)
print(accuracy_score(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

filename = 'boost-detector.pkl'
with open(filename, 'wb') as f:
    pkl.dump(model, f)
v_filename = 'boost-vectorizer.pkl'
with open(v_filename, 'wb') as f:
    pkl.dump(vectorizer, f)
filename = 'boost-scaler.pkl'
with open(filename, 'wb') as f:
    pkl.dump(scaler, f)
filename = 'boost-encoder.pkl'
with open(filename, 'wb') as f:
    pkl.dump(encoder, f)