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

text_vectorized = vectorizer.transform(["Thank you for your submission! Here is some feedback on your paper: Your current situation shows your understanding of the issues your position faces and key initiatives being undergone, great job! We would love to see more information about specific actions taken by your position in collaboration with corporations or on a global scale in your past action section. Otherwise, your solutions show great consideration for your position's main goals with checks and balances for all parties involved. Your work shows a deep understanding of the topic and preparedness for the conference. If you have any questions regarding your feedback please do not hesitate to reach out. We cannot wait to see you in committee!"])
prediction = model.predict(text_vectorized)
print(prediction)