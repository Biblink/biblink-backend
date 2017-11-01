from flask import Flask, request, jsonify
from bible_functions import Bible
app = Flask(__name__)


@app.route('/')
def api_root():
    query = request.args.get('query')
    Bible(query)
    matched_query = query.parse_query 
    data = matched_query.get_data 
    return jsonify(data) 

if __name__ == '__main__':
    app.run(port='5000')
