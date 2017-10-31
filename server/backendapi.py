from flask import Flask, request
app = Flask(__name__)

@app.route('/')
def api_root(): 
    return 'Hello'

if __name__ == '__main__':
    app.run(port='5000')
