"""Server to run bible python API

Authors: Brandon Fan, Jordan Seiler
Last Edit Date: 12/26/2017
"""

import uuid
import os
from flask import Flask, request, jsonify
from bible_functions import Bible
from similarity_functions import Similarity
from es_functions import SearchES

APP = Flask(__name__)

# paths from running from heroku outside of folder
BIBLE_FILE = './files/english-web-bible.json'
GLOVE_FILE = './files/glove.6B.200d.txt'
print('Initializing Bible Class...')
BIBLE = Bible(BIBLE_FILE)
print('Initializing Similarity Class...')
SIMILARITY = Similarity(BIBLE_FILE, GLOVE_FILE, initialize=True)
print('Initializing Elastic Search Class')
ELASTICSEARCH = SearchES()

@APP.route('/query')
def process_query():
    """Route to process queries from /query route

    Takes `query` parameter from /query route, parses queries then
    gets values and returns a json response of the data.

    Returns:
        (dict): response dictionary of requested data
        response is below::

            {
                'data': (list),
                'query': (str),
                'query_id': (str),
                'url': (str)
            }

    """
    query_id = str(uuid.uuid4())
    response = {'query_id': query_id, 'url': request.url}
    query = request.args.get('query')
    response['query'] = query
    matched_query = BIBLE.parse_query(query)
    results_list = []
    for temp_data in matched_query['queries']:
        temp_var = BIBLE.get_data(matched_query['book'],
                                  temp_data['chapter'],
                                  temp_data['verses'])
        results_list.append(temp_var)
    response['data'] = results_list
    return jsonify(response)


@APP.route('/similarity')
def compute_similarity():
    """Route to process verse similarities from /similarity route

    Takes `verse reference` parameter from /similarity route, parses verse reference
    gets verse and computes similar verses

    Returns:
        (dict): response dictionary of requested data
        response is below::

            {
                'similar_verses': (list),
                'verse': (str),
                'similarity_id': (str),
                'url': (str)
            }

    """
    similarity_id = str(uuid.uuid4())
    response = {'similarity_id': similarity_id, 'url': request.url}
    query = request.args.get('reference')
    response['reference'] = query
    matched_query = BIBLE.parse_query(query)
    assert len(matched_query['queries']) == 1
    queries = matched_query['queries'][0]
    temp_var = BIBLE.get_data(matched_query['book'],
                              queries['chapter'],
                              queries['verses'])
    assert len(temp_var['verse_data']) == 1
    response['similar_verses'] = SIMILARITY.get_similar_values(
        temp_var['verse_data'][0]['verse'])
    response['verse'] = temp_var['verse_data'][0]
    return jsonify(response)


@APP.route('/search')
def search_bible():
    """Route to search for phrase or term in bible from /search route

    Takes `term` parameter from /search route, and utilizes ElasticSearch to
    to search bible for associated verse data

    Returns:
        (dict): response dictionary of requested data
        response is below::

            {
                'results': (list),
                'term': (str),
                'search_id': (str),
                'url': (str)
            }

    """
    search_id = str(uuid.uuid4())
    response = {'search_id': search_id, 'url': request.url} 
    term = request.args.get('term')
    response['term'] = term
    results = ELASTICSEARCH.search(term)
    response['results'] = results
    return jsonify(response)

if __name__ == '__main__':
    print('Initializing Server...')
    PORT = int(os.environ.get("PORT", 5000))
    APP.run(host='0.0.0.0', port=PORT)
