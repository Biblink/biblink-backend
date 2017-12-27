# -*- coding: utf-8 -*-
"""Script to create index of bible for ElasticSearch

Authors: Brandon Fan
Last Edit Date: 12/27/2017
"""
import json
from elasticsearch import Elasticsearch


def create_index():
    """creates index of bible verses for elasticsearch"""
    es = Elasticsearch()
    bible_file_path = '../bible-files/english-web-bible.json'
    bible_file = open(bible_file_path, encoding='utf-8-sig')
    bible = json.load(bible_file)
    documents = []
    for book in bible:
        book_data = book['data']
        for chapter_data in book_data:
            verses = chapter_data['verses']
            for verse in verses:
                documents.append(verse)

    for document in documents:
        es.index(index='bible-index', doc_type='verse', body=document)


if __name__ == '__main__':
    create_index()
