"""Similarity Class to handle verse similarities
Authors: Brandon Fan
Last Edit Date: 11/5/2017
"""

import os
import string
import json
import numpy as np
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import gensim
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class Similarity(object):
    """Similarity class that utilizes deep learning to find similar verses

    Uses gensim Doc2Vec and scikit-learn TF-IDF to calculate similar verses

    Attributes:
        bible_file (str): Bible file path to load JSON file.
        use_nltk (bool | optional): Whether or not to use nltk processing
    """

    def __init__(self, bible_file, use_nltk=False):
        if bible_file.endswith('.json') and os.path.isfile(bible_file):
            self.bible_data = json.load(
                open(bible_file, encoding='utf-8-sig'))
            self.verse_data = []
        else:
            self._throw_value_error('Please enter a proper json file')
        for book in self.bible_data:
            for chapter in book['data']:
                for verses in chapter['verses']:
                    self.verse_data.append(verses)

        self.stopwords_list = set(stopwords.words('english'))
        self.exclude = set(string.punctuation)
        self.tagged_docs = list(self.create_corpus(
            self.verse_data, use_nltk=use_nltk))
        self.model = gensim.models.Doc2Vec.load('doc2vec.model')
        self.tokenize_data(self.verse_data)

    def tokenize_data(self, verse_data):
        """Tokenizes passed in verse data
        Uses nltk word_tokenize to tokenize sentences into words

        Attributes:
            verse_data (dict): dictionary of verse data
        """
        for verse in verse_data:
            text = ''.join(
                ch for ch in verse['text'] if ch not in self.exclude)
            tokenized_text = word_tokenize(text)
            final_text = []
            for val in tokenized_text:
                if val not in self.stopwords_list:
                    if 'Yahweh' in val:
                        val = val.replace('Yahweh', 'God')
                    final_text.append(val)
            verse['tokenized_text'] = final_text

    @staticmethod
    def _throw_value_error(information):
        raise ValueError(information)

    @staticmethod
    def create_corpus(verse_tokenized_data, use_nltk=False):
        """Creates corpus of tagged documents based off of tokenized data
        Uses either nltk or gensim.utils

        Attributes:
            verse_tokenized_data (dict): dictionary of verse data
            use_nltk (bool | optional): whether or not to use nltk
        """
        for verse in verse_tokenized_data:
            if use_nltk:
                words = verse['tokenized_text']
                yield gensim.models.doc2vec.TaggedDocument(words, [verse['verse']])
            else:
                words = verse['text']
                yield gensim.models.doc2vec.TaggedDocument(gensim.utils.simple_preprocess(words),
                                                           [verse['verse']])

    def get_similar_values(self, text, total_values=10):
        """Gets similar values using Doc2Vec and TF-IDF
        Uses Doc2Vec and TF-IDF combined to produce certain amount of
        similar bible verses

        Attributes:
            text (str): verse text to find similar values
            total_values (int | optional): number of values to return
        """
        inferred_vector = self.model.infer_vector(text)
        most_similar = self.model.docvecs.most_similar(
            [inferred_vector], topn=total_values + 10)
        text = [''.join(text)]
        verses = []
        for verse_name, _ in most_similar:
            for verse in self.verse_data:
                if verse['verse'] == verse_name:
                    text.append(verse['text'])
                    verses.append(verse['verse'])
        vectorizer = TfidfVectorizer(stop_words='english')
        tf_idf_transform = vectorizer.fit_transform(text)
        sim_text = cosine_similarity(tf_idf_transform)[0][1:]
        final_text = []
        final_indices = list(reversed(np.argsort(sim_text)))[:10]
        for index in final_indices:
            final_text.append({'verse': verses[index], 'text': text[index]})
        return final_text
