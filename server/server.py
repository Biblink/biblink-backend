"""Server to run bible python API

Authors: Brandon Fan, Jordan Seiler
Last Edit Date: 11/16/2017
"""
import random
import os
from flask import Flask, request, jsonify
from bible_functions import Bible
from similarity_functions import Similarity

APP = Flask(__name__)

# paths from running from heroku outside of folder
BIBLE_FILE = './files/english-web-bible.json'
GLOVE_FILE = './files/glove.6B.200d.txt'
print('Initializing Bible Class...')
BIBLE = Bible(BIBLE_FILE)
print('Initializing Similarity Class...')
SIMILARITY = Similarity(BIBLE_FILE, GLOVE_FILE)


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
                'query_id': (int),
                'url': (str)
            }

    """
    rand_num = random.randint(1, 1000000)
    response = {'query_id': rand_num, 'url': request.url}
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
                'similarity_id': (int),
                'url': (str)
            }

    """
    rand_num = random.randint(1, 1000000)
    response = {'similarity_id': rand_num, 'url': request.url}
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


if __name__ == '__main__':
    print('Initializing Server...')
    PORT = int(os.environ.get("PORT", 5000))
    APP.run(port=PORT)
