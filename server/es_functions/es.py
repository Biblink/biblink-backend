# -*- coding: utf-8 -*-
"""SearchES Class to handle searching with ElasticSearch

Authors: Brandon Fan
Last Edit Date: 1/15/2018
"""

import json
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Q
from fuzzywuzzy import fuzz
import re

class SearchES(object):
    """Class to search using ElasticSearch"
    Attributes:
        books (list): List of books in the Protestant bible.
        client (ElasticSearch): ElasticSearch client object.
        verse_parser (Regex): Regular expression to parse a verse
    """

    def __init__(self, book_file_path):
        """initializes elasticsearch instance (note: must have ES instance running on localhost:9200)"""
        self.books = open(book_file_path).read().split('\n')
        self.client = Elasticsearch()
        self.verse_parser = re.compile(r'(\d\s)?([\w\.]+)\s+([\d:,\-\s\;]+)')

    def search(self, term):
        """Function to search elasticsearch index
        Takes a term or phrase argument and does fuzzy match query through elastic search upon bible

        Args:
            term (str): term or phrase to fuzzy search upon
        
        Returns:
            (dict): response dictionary with associated scores
            response is below::
                [
                    {
                        'verse': (str),
                        'verse_number': (int)
                        'text': (str),
                        'score': (str)
                    }
                    ...
                ] (length of list = 10)
        """

        search_definition = Search(using=self.client, index='bible-index')
        match = self.verse_parser.match(term)

        if match:
            query_string = Q('match', verse=term)
            response = search_definition.query(query_string).highlight('verse').execute()
            highlight_param = 'verse'
        else:
            book_match = max(list(map(lambda book: fuzz.ratio(term.strip().lower(), book), self.books)))
            sorted_books = list(reversed(sorted(self.books, key=lambda book: fuzz.ratio(term.strip().lower(), book))))
            if book_match >= 60:
                book_query = Q('bool', must=[Q('match', book=sorted_books[0])])
                query_string = book_query
                response = search_definition.query(query_string).highlight('book').execute()
                highlight_param = 'book'
            else:
                query_string = Q(
                    'match_phrase', text={'query': term, 'slop': 2})
                response = search_definition.query(query_string).highlight('text').execute()
                highlight_param = 'text'
        final_response = []
        for hit in response.hits.hits:
            data = hit['_source']
            data['score'] = str(hit['_score'])
            if highlight_param == 'text':
                data['text'] = ' '.join(hit['highlight']['text']).strip()
            elif highlight_param == 'book':
                ref = data['verse'].split()[-1]
                data['verse'] = ' '.join(hit['highlight']['book']).strip() + ' ' + ref
            elif highlight_param == 'verse':
                data['verse'] = ' '.join(hit['highlight']['verse']).strip()
            final_response.append(data)
        return final_response

if __name__ == '__main__':
    TEST_SEARCH = SearchES('../files/books.txt')
    TEST_RESPONSE = TEST_SEARCH.search('John 1:1')
    print(json.dumps(TEST_RESPONSE, indent=4))
