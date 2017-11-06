"""Server to run Bible python API
Authors: Brandon Fan, Jordan Seiler
Last Edit Date: 11/5/2017
Todo:
    * implement verse similarity route
"""
import random
from flask import Flask, request, jsonify
from bible_functions import Bible
from similarity_functions import Similarity

APP = Flask(__name__)
BIBLE_FILE = '../bible-files/english-web-bible.json'
BIBLE = Bible(BIBLE_FILE)
SIMILARITY = Similarity(BIBLE_FILE)


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
                'data': (list),
                'query': (str),
                'query_id': (int),
                'url': (str)
            }

    """
    rand_num = random.randint(1, 1000000)
    response = {'similarity_id': rand_num, 'url': request.url}
    query = request.args.get('reference')
    response['reference'] = query
    matched_query = BIBLE.parse_query(query)
    assert len(matched_query['queries']) == 1
    matched_query['queries'] = matched_query['queries'][0]
    temp_var = BIBLE.get_data(matched_query['book'],
                              temp_data['chapter'],
                              temp_data['verses'])
    response['similar_verses'] = SIMILARITY.get_similar_values(
        temp_var['combined_text'])
    response['verse'] = temp_var
    response['data'] = results_list
    return jsonify(response)


if __name__ == '__main__':
    APP.run(port=5000)
