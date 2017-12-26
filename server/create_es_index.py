import json
from elasticsearch import Elasticsearch

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
