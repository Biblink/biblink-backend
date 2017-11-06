"""Similarity Class to handle verse similarities
Authors: Brandon Fan
Last Edit Date: 11/5/2017
Todo:
    * implement proper documentation and docstrings
"""

import os
import json
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import gensim


class Similarity(object):
    def __init__(self, bible_file, use_nltk=False):
        if bible_file.endswith('.json'):
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
        self.tagged_docs = list(self._create_corpus(self.verse_data, use_nltk=use_nltk=False))
        self.model = gensim.models.Doc2Vec.load('doc2vec.model')
        self.tokenize_data(self.verse_data)

    def _tokenize_data(self, verse_data):
        for verse in verse_data:
            text = ''.join(ch for ch in verse['text'] if ch not in exclude)
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

    def _create_corpus(self, verse_tokenized_data, use_nltk=False):
        for verse in self.verse_data:
            if use_nltk:
                words = verse['tokenized_text']
                yield gensim.models.doc2vec.TaggedDocument(words, [verse['verse']])
            else:
                words = verse['text']
                yield gensim.models.doc2vec.TaggedDocument(gensim.utils.simple_preprocess(words), [verse['verse']])

    def get_similar_values(self, text, total_values=10):
        inferred_vector = self.model.infer_vector(text)
        most_similar = self.model.docvecs.most_similar(
            [inferred_vector], topn=total_values + 10)
        text = [''.join(tokenized_text)]
        verses = []
        for verse_name, _ in most_similar:
            for verse in verse_data:
                if verse['verse'] == verse_name:
                    text.append(verse['text'])
                    verses.append(verse['verse'])
        vectorizer = TfidfVectorizer(stop_words='english')
        tf_idf_transform = vectorizer.fit_transform(text)
        cos_sim_matrix = cosine_similarity(tf_idf_transform)
        sim_text = cos_sim_matrix[0][1:]
        final_text = []
        final_indices = list(reversed(np.argsort(sim_text)))[:10]
        for index in final_indices:
            final_text.append({'verse': verses[index], 'text': text[index]})
        return final_text
