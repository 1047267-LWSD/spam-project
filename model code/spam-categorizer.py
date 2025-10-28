import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.linear_model import SGDClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
import pickle as pkl
df2 = pd.read_csv('datasets/spam-data.csv', encoding = 'latin1')[['v2','Category']]
print(df2.head())
X_train, X_test, y_train, y_test = train_test_split(df2['v2'], df2['Category'], test_size = 0.2, random_state = 0)
vectorizer = TfidfVectorizer(stop_words=None, ngram_range=(1,2), max_features=2000, min_df=2, max_df=0.90)
X_train = vectorizer.fit_transform(X_train)
X_test = vectorizer.transform(X_test) 
param_grid = {
    'loss': ['log_loss', 'hinge','squared_error'],
    'alpha': [0.1, 0.001, 0.0001],
    'max_iter': [100, 500, 1000],
    'class_weight': [None, 'balanced']
}
grid = GridSearchCV(SGDClassifier(), param_grid, refit = True, verbose=2, scoring='f1_macro')
grid.fit(X_train, y_train) 
print('Best parameters: ', grid.best_params_)
grid_predictions = grid.predict(X_test)
print(classification_report(y_test, grid_predictions))

model = SGDClassifier(loss = 'squared_error', alpha = 0.001, class_weight = None, max_iter = 100)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))


filename = 'spam-categorizer.pkl'
with open(filename, 'wb') as f:
    pkl.dump(model, f)
v_filename = 'categorizer-vectorizer.pkl'
with open(v_filename, 'wb') as f:
    pkl.dump(vectorizer, f)

