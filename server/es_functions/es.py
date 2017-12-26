# -*- coding: utf-8 -*-
"""SearchES Class to handle searching with ElasticSearch

Authors: Brandon Fan
Last Edit Date: 12/26/2017
"""

import json
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Q

class SearchES(object):
    """Class to search using ElasticSearch"""
    def __init__(self):
        """initializes elasticsearch instance (note: must have ES instance running on localhost:9200)"""
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
        query_string = Q(
            'fuzzy', text={'value': term, 'fuzziness': 2, 'boost': 1.0})
        search_definition = search_definition.query(query_string)
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
