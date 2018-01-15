# -*- coding: utf-8 -*-
"""SearchES Class to handle searching with ElasticSearch

Authors: Brandon Fan
Last Edit Date: 12/26/2017
"""

import json
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Q
from fuzzywuzzy import fuzz
import re

class SearchES(object):
    """Class to search using ElasticSearch"""
    def __init__(self):
        """initializes elasticsearch instance (note: must have ES instance running on localhost:9200)"""
        self.books = open('books.txt').read().split('\n')
        self.verse_parser = re.compile(r'(\d\s)?([\w\.]+)\s+([\d:,\-\s\;]+)')
        self.client = Elasticsearch()

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
            query_string = search_definition.query('match', verse=term).execute()
        else:
            book_match = max(list(map(lambda book: fuzz.ratio(term.strip().lower(), book), self.books)))
            sorted_books = list(reversed(sorted(self.books, key=lambda book: fuzz.ratio(term.strip().lower(), book))))
            if book_match >= 60:
                book_query = Q('bool', must=[Q('match', book=sorted_books[0])])
                query_string = book_query
            else:
                query_string = Q(
                    'match_phrase', text={'query': term, 'slop': 2})

        search_definition.query(query_string)
        response = search_definition.execute()
        final_response = []
        for hit in response.hits.hits:
            data = hit['_source']
            data['score'] = str(hit['_score'])
            final_response.append(data)
        return final_response

if __name__ == '__main__':
    TEST_SEARCH = SearchES()
    TEST_RESPONSE = TEST_SEARCH.search('god')
    print(json.dumps(TEST_RESPONSE, indent=4))
