"""Server to run bible python API

Authors: Brandon Fan, Jordan Seiler
Last Edit Date: 1/15/2018
"""

import uuid
import os
import json
from flask import Flask, request, jsonify, Response
from bible_functions import Bible
from similarity_functions import Similarity
from es_functions import SearchES

APP = Flask(__name__)

# paths from running from heroku outside of folder
BIBLE_FILE = './files/english-web-bible.json'
BOOK_PATH = './files/books.txt'
GLOVE_FILE = './files/glove.6B.200d.txt'
SIM_MATRIX = './similarity_functions/sim_matrix_50.pkl'
print('Initializing Bible Class...')
BIBLE = Bible(BIBLE_FILE)
print('Initializing Similarity Class...')
SIMILARITY = Similarity(BIBLE_FILE, GLOVE_FILE, SIM_MATRIX, initialize=True)
print('Initializing Elastic Search Class')
ELASTICSEARCH = SearchES(BOOK_PATH)


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
    if query is not None:
        parse_query = True
    else:
        parse_query = False
    if not parse_query:
        book = request.args.get('book')
        chapter = request.args.get('chapter')
    if parse_query:
        response['query'] = query
        matched_query = BIBLE.parse_query(query)
        results_list = []
        for temp_data in matched_query['queries']:
            temp_var = BIBLE.get_data(matched_query['book'],
                                      temp_data['chapter'],
                                      temp_data['verses'])
            results_list.append(temp_var)
    else:
        results_list = [BIBLE.get_data(book, chapter)]
    response['data'] = results_list
    resp = Response(json.dumps(response), status=200, mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


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
    resp = Response(json.dumps(response), status=200, mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


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
    try:
        sort_type = request.args.get('sort_type')
    except Exception:
        sort_type = 'relevant'
    response['term'] = term
    results = ELASTICSEARCH.search(term, sort_type)
    response['results'] = results
    resp = Response(json.dumps(response), status=200, mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


if __name__ == '__main__':
    print('Initializing Server...')
    PORT = int(os.environ.get("PORT", 5000))
    APP.run(host='0.0.0.0', port=PORT)
