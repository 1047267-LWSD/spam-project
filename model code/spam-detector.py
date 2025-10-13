import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import pickle as pkl
df = pd.read_csv('datasets/hamspam.csv', encoding='latin1')[['v1','v2']]
print(df.head())

X_train, X_test, y_train, y_test = train_test_split(df['v2'], df['v1'], test_size = 0.2, random_state = 0)
vectorizer = TfidfVectorizer()
X_train = vectorizer.fit_transform(X_train)
X_test = vectorizer.transform(X_test)
model = LogisticRegression( max_iter=1000, class_weight='balanced')

model.fit(X_train,y_train)
y_pred = model.predict(X_test)
print(accuracy_score(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))
filename = 'spam-detector.pkl'
with open(filename, 'wb') as f:
    pkl.dump(model, f)
v_filename = 'detector-vectorizer.pkl'
with open(v_filename, 'wb') as f:
    pkl.dump(vectorizer, f)

