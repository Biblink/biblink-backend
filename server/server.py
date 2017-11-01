"""Server to run Bible python API
Authors: Brandon Fan, Jordan Seiler
Last Edit Date: 10/31/2017
"""
import random
from flask import Flask, request, jsonify
from bible_functions import Bible
app = Flask(__name__)

instance = None


@app.route('/query')
def process_query():
    rand_num = random.randint(1, 1000000)
    response = {'query_id': rand_num, 'url': request.url}
    query = request.args.get('query')
    response['query'] = query
    matched_query = instance.parse_query(query)
    results_list = []
    for temp_data in matched_query['queries']:
        temp_var = instance.get_data(matched_query['book'],
                                     temp_data['chapter'],
                                     temp_data['verses'])
        results_list.append(temp_var)
    response['data'] = results_list
    return jsonify(response)


if __name__ == '__main__':
    instance = Bible('../bible-files/english-web-bible.json')
    app.run(port='5000')
